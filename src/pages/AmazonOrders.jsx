import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ShoppingCart, RefreshCw, AlertCircle,
} from 'lucide-react';
import { accountsApi } from '../api/accounts';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { extractError, formatDate } from '../lib/utils';

// ── Constants ─────────────────────────────────────────────────

const TABS = [
    { key: 'active',    label: 'Active Orders',  orderStatuses: ['Unshipped', 'PartiallyShipped', 'Pending'] },
    { key: 'shipped',   label: 'Shipped',         orderStatuses: ['Shipped', 'InvoiceUnconfirmed'] },
    { key: 'cancelled', label: 'Cancelled',       orderStatuses: ['Canceled'] },
];

const STATUS_COLORS = {
    Pending:              'text-slate-600 bg-slate-50 border-slate-200',
    PendingAvailability:  'text-slate-600 bg-slate-50 border-slate-200',
    Unshipped:            'text-blue-700 bg-blue-50 border-blue-200',
    PartiallyShipped:     'text-amber-700 bg-amber-50 border-amber-200',
    Shipped:              'text-emerald-700 bg-emerald-50 border-emerald-200',
    InvoiceUnconfirmed:   'text-indigo-700 bg-indigo-50 border-indigo-200',
    Canceled:             'text-red-600 bg-red-50 border-red-200',
    Unfulfillable:        'text-red-700 bg-red-100 border-red-300',
};

const FULFILLMENT_LABELS = {
    MFN: 'Self Ship',
    AFN: 'Fulfilled by Amazon',
};

// ── Helpers ───────────────────────────────────────────────────

const isUrgent = (dispatchBy) => {
    if (!dispatchBy) return false;
    return new Date(dispatchBy) - new Date() < 24 * 60 * 60 * 1000;
};

// ── Order Card ────────────────────────────────────────────────

function OrderCard({ order, index }) {
    const urgent = isUrgent(order.dispatchBy);

    return (
        <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500 truncate">{order.orderId}</p>
                    {order.fulfillmentChannel && (
                        <p className="text-xs text-slate-400 mt-0.5">
                            {FULFILLMENT_LABELS[order.fulfillmentChannel] || order.fulfillmentChannel}
                        </p>
                    )}
                </div>
                <Badge className={STATUS_COLORS[order.status] ?? 'text-slate-500 bg-slate-50 border-slate-200'}>
                    {order.status || 'UNKNOWN'}
                </Badge>
            </div>

            {/* Order details */}
            <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1 text-xs">
                {order.totalAmount != null && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Order Total</span>
                        <span className="font-semibold text-slate-800">
                            {order.currency} {order.totalAmount.toFixed(2)}
                        </span>
                    </div>
                )}
                {order.itemCount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Items</span>
                        <span className="text-slate-700">{order.itemCount}</span>
                    </div>
                )}
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {order.orderDate && (
                    <span className="text-slate-400">Ordered: {formatDate(order.orderDate)}</span>
                )}
                {order.dispatchBy && (
                    <span className={urgent ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                        {urgent ? '⚠ ' : ''}Ship by: {formatDate(order.dispatchBy)}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────

export function AmazonOrdersPage() {
    const { sellerId, accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('active');

    const tabConfig = TABS.find((t) => t.key === activeTab);

    const { data, isFetching, error, refetch } = useQuery({
        queryKey: ['amazon-orders', accountId, activeTab],
        queryFn: () => accountsApi.getOrders(sellerId, accountId, {
            tab:          activeTab,
            orderStatuses: tabConfig.orderStatuses,
        }),
        select:    (res) => res.data.data,
        staleTime: 60 * 1000,
    });

    const orders  = data?.orders  ?? [];
    const hasMore = data?.hasMore ?? false;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <ShoppingCart size={22} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900">Amazon Orders</h1>
                    <p className="text-sm text-slate-400 truncate">Account: {accountId}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                </button>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isFetching && orders.length === 0 ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : error ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Failed to fetch orders</p>
                        <p className="mt-1 text-xs">{extractError(error)}</p>
                        {extractError(error).includes('Refresh Token') && (
                            <p className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
                                Go to your account credentials and add the Refresh Token from Amazon Seller Central → Apps & Services → Manage Your Apps.
                            </p>
                        )}
                    </div>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                        <ShoppingCart size={24} className="text-orange-300" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">No {tabConfig.label.toLowerCase()}</p>
                        <p className="text-sm text-slate-400 mt-1">
                            {activeTab === 'active'
                                ? 'No active orders awaiting fulfillment'
                                : `No ${tabConfig.label.toLowerCase()} found`}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        {isFetching ? 'Refreshing...' : `${orders.length} order${orders.length !== 1 ? 's' : ''}${hasMore ? '+' : ''}`}
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {orders.map((order, i) => (
                            <OrderCard key={order.orderId} order={order} index={i} />
                        ))}
                    </div>
                    {hasMore && (
                        <p className="text-xs text-slate-400 text-center pt-2">
                            More orders available — use date filters to narrow results.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
