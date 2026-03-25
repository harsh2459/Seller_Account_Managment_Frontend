import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    ArrowLeft, ShoppingBag, RefreshCw, Package,
    Truck, XCircle, Download, AlertCircle,
    Loader2, CheckSquare, Square, FileText,
    CheckCheck,
} from 'lucide-react';
import { accountsApi } from '../api/accounts';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { extractError, formatDate } from '../lib/utils';

// ── Constants ─────────────────────────────────────────────────

const TABS = [
    { key: 'active',    label: 'Active Orders',  type: 'preDispatch'  },
    { key: 'shipped',   label: 'Shipped',         type: 'postDispatch' },
    { key: 'cancelled', label: 'Cancelled',       type: 'cancelled'    },
];

const ACTIVE_STATES = ['APPROVED', 'PACKING_IN_PROGRESS', 'PACKED', 'READY_TO_DISPATCH'];

const STATUS_COLORS = {
    APPROVED:            'text-blue-700 bg-blue-50 border-blue-200',
    PACKING_IN_PROGRESS: 'text-amber-700 bg-amber-50 border-amber-200',
    PACKED:              'text-indigo-700 bg-indigo-50 border-indigo-200',
    READY_TO_DISPATCH:   'text-violet-700 bg-violet-50 border-violet-200',
    SHIPPED:             'text-emerald-700 bg-emerald-50 border-emerald-200',
    DELIVERED:           'text-green-700 bg-green-100 border-green-300',
    CANCELLED:           'text-red-600 bg-red-50 border-red-200',
};

const CANCEL_REASONS = [
    { value: 'cannot_procure_item',   label: 'Cannot Procure Item' },
    { value: 'not_enough_inventory',  label: 'Not Enough Inventory' },
    { value: 'b2b_order',             label: 'B2B Order' },
];

// ── Helpers ───────────────────────────────────────────────────

const isUrgent = (dispatchBy) => {
    if (!dispatchBy) return false;
    return new Date(dispatchBy) - new Date() < 24 * 60 * 60 * 1000;
};

const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ── Pack Form (single, inline) ────────────────────────────────

function PackForm({ shipment, sellerId, accountId, onSuccess, onCancel }) {
    const [dims, setDims] = useState({ length: '', breadth: '', height: '', weight: '' });

    const packMutation = useMutation({
        mutationFn: () => accountsApi.packShipment(sellerId, accountId, {
            shipmentId:   shipment.shipmentId,
            locationId:   shipment.locationId || '',
            subShipments: (shipment.subShipments?.length
                ? shipment.subShipments
                : [{ subShipmentId: shipment.shipmentId }]
            ).map((sub) => ({
                subShipmentId: sub.subShipmentId || sub.id || shipment.shipmentId,
                dimensions: {
                    length:  parseFloat(dims.length),
                    breadth: parseFloat(dims.breadth),
                    height:  parseFloat(dims.height),
                    weight:  parseFloat(dims.weight),
                },
            })),
        }),
        onSuccess: () => { toast.success('Shipment packed!'); onSuccess(); },
        onError:   (err) => toast.error(extractError(err)),
    });

    const field = (key, label) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{label}</label>
            <input
                type="number" min="0.1" step="0.1" placeholder="0"
                value={dims[key]}
                onChange={(e) => setDims((p) => ({ ...p, [key]: e.target.value }))}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 w-full"
            />
        </div>
    );

    const valid = dims.length && dims.breadth && dims.height && dims.weight;

    return (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-medium text-slate-600">Enter package dimensions (cm / kg)</p>
            <div className="grid grid-cols-2 gap-2">
                {field('length',  'Length (cm)')}
                {field('breadth', 'Breadth (cm)')}
                {field('height',  'Height (cm)')}
                {field('weight',  'Weight (kg)')}
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => packMutation.mutate()}
                    disabled={!valid || packMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                    {packMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
                    Confirm Pack
                </button>
                <button onClick={onCancel} className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── Cancel Form (inline) ──────────────────────────────────────

function CancelForm({ shipment, sellerId, accountId, onSuccess, onCancel }) {
    const [reason, setReason] = useState('');

    const cancelMutation = useMutation({
        mutationFn: () => accountsApi.cancelShipment(sellerId, accountId, {
            shipmentId: shipment.shipmentId,
            locationId: shipment.locationId || '',
            reason,
        }),
        onSuccess: () => { toast.success('Shipment cancelled'); onSuccess(); },
        onError:   (err) => toast.error(extractError(err)),
    });

    return (
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 space-y-3">
            <p className="text-xs font-medium text-red-700">Select cancellation reason</p>
            <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-red-400 bg-white"
            >
                <option value="">-- Select reason --</option>
                {CANCEL_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
            </select>
            <div className="flex gap-2">
                <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={!reason || cancelMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                    {cancelMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Confirm Cancel
                </button>
                <button onClick={onCancel} className="px-3 py-2 rounded-lg border border-red-200 text-xs text-slate-500 hover:bg-red-100 transition-colors">
                    Back
                </button>
            </div>
        </div>
    );
}

// ── Bulk Pack Modal ───────────────────────────────────────────

function BulkPackModal({ orders, sellerId, accountId, onSuccess, onClose }) {
    const [dims, setDims] = useState({ length: '', breadth: '', height: '', weight: '' });

    const bulkPackMutation = useMutation({
        mutationFn: () => accountsApi.bulkPackShipments(sellerId, accountId, {
            shipments: orders.map((o) => ({
                shipmentId:   o.shipmentId,
                locationId:   o.locationId || '',
                subShipments: (o.subShipments?.length
                    ? o.subShipments
                    : [{ subShipmentId: o.shipmentId }]
                ).map((sub) => ({
                    subShipmentId: sub.subShipmentId || sub.id || o.shipmentId,
                    dimensions: {
                        length:  parseFloat(dims.length),
                        breadth: parseFloat(dims.breadth),
                        height:  parseFloat(dims.height),
                        weight:  parseFloat(dims.weight),
                    },
                })),
            })),
        }),
        onSuccess: () => {
            toast.success(`${orders.length} shipment${orders.length > 1 ? 's' : ''} packed!`);
            onSuccess();
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const valid = dims.length && dims.breadth && dims.height && dims.weight;

    const field = (key, label) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{label}</label>
            <input
                type="number" min="0.1" step="0.1" placeholder="0"
                value={dims[key]}
                onChange={(e) => setDims((p) => ({ ...p, [key]: e.target.value }))}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-400 w-full"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm space-y-4 p-5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div>
                    <h3 className="font-semibold text-slate-800">Bulk Pack — {orders.length} Shipments</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Same dimensions applied to all selected orders</p>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto p-2 space-y-1">
                    {orders.map((o) => (
                        <p key={o.shipmentId} className="text-xs font-mono text-slate-500 truncate">{o.shipmentId}</p>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {field('length',  'Length (cm)')}
                    {field('breadth', 'Breadth (cm)')}
                    {field('height',  'Height (cm)')}
                    {field('weight',  'Weight (kg)')}
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => bulkPackMutation.mutate()}
                        disabled={!valid || bulkPackMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                    >
                        {bulkPackMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                        Pack All
                    </button>
                    <button
                        onClick={onClose}
                        disabled={bulkPackMutation.isPending}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Bulk Action Bar ───────────────────────────────────────────

function BulkActionBar({ selectedOrders, sellerId, accountId, onSuccess, onClearSelection, onBulkPack }) {
    const approvedOrders = selectedOrders.filter((o) => o.status === 'APPROVED');
    const packedOrders   = selectedOrders.filter((o) => o.status === 'PACKED');
    const readyOrders    = selectedOrders.filter((o) => o.status === 'READY_TO_DISPATCH');

    const bulkDispatchMutation = useMutation({
        mutationFn: () => accountsApi.markReadyToDispatch(sellerId, accountId, {
            shipmentIds: packedOrders.map((o) => o.shipmentId),
            locationId:  packedOrders[0]?.locationId || '',
        }),
        onSuccess: () => {
            toast.success(`${packedOrders.length} shipment${packedOrders.length > 1 ? 's' : ''} marked ready to dispatch!`);
            onSuccess();
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const bulkLabelsMutation = useMutation({
        mutationFn: () => accountsApi.downloadLabels(sellerId, accountId, readyOrders.map((o) => o.shipmentId)),
        onSuccess: (res) => {
            triggerDownload(res.data, `labels-bulk-${Date.now()}.pdf`);
            toast.success(`Labels downloaded for ${readyOrders.length} shipment${readyOrders.length > 1 ? 's' : ''}`);
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const manifestMutation = useMutation({
        mutationFn: () => accountsApi.downloadManifest(sellerId, accountId, readyOrders.map((o) => o.shipmentId)),
        onSuccess: (res) => {
            triggerDownload(res.data, `manifest-${Date.now()}.pdf`);
            toast.success('Manifest downloaded');
        },
        onError: (err) => toast.error(extractError(err)),
    });

    return (
        <motion.div
            className="sticky top-0 z-10 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-md flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCheck size={15} className="text-brand-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{selectedOrders.length} selected</span>
                <button onClick={onClearSelection} className="text-xs text-slate-400 hover:text-slate-600 underline ml-1">
                    Clear
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {approvedOrders.length > 0 && (
                    <button
                        onClick={() => onBulkPack(approvedOrders)}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Package size={12} />
                        Pack {approvedOrders.length > 1 ? `(${approvedOrders.length})` : ''}
                    </button>
                )}

                {packedOrders.length > 0 && (
                    <button
                        onClick={() => bulkDispatchMutation.mutate()}
                        disabled={bulkDispatchMutation.isPending}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {bulkDispatchMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                        Dispatch {packedOrders.length > 1 ? `(${packedOrders.length})` : ''}
                    </button>
                )}

                {readyOrders.length > 0 && (
                    <>
                        <button
                            onClick={() => bulkLabelsMutation.mutate()}
                            disabled={bulkLabelsMutation.isPending}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {bulkLabelsMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            Labels {readyOrders.length > 1 ? `(${readyOrders.length})` : ''}
                        </button>

                        <button
                            onClick={() => manifestMutation.mutate()}
                            disabled={manifestMutation.isPending}
                            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {manifestMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                            Manifest {readyOrders.length > 1 ? `(${readyOrders.length})` : ''}
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ── Order Card ────────────────────────────────────────────────

function OrderCard({ order, sellerId, accountId, onRefetch, selected, onToggleSelect }) {
    const [showPack,   setShowPack]   = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    const dispatchMutation = useMutation({
        mutationFn: () => accountsApi.markReadyToDispatch(sellerId, accountId, {
            shipmentIds: [order.shipmentId],
            locationId:  order.locationId || '',
        }),
        onSuccess: () => { toast.success('Marked ready to dispatch!'); onRefetch(); },
        onError:   (err) => toast.error(extractError(err)),
    });

    const labelsMutation = useMutation({
        mutationFn: () => accountsApi.downloadLabels(sellerId, accountId, [order.shipmentId]),
        onSuccess: (res) => {
            triggerDownload(res.data, `labels-${order.shipmentId}.pdf`);
            toast.success('Label downloaded');
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const manifestMutation = useMutation({
        mutationFn: () => accountsApi.downloadManifest(sellerId, accountId, [order.shipmentId]),
        onSuccess: (res) => {
            triggerDownload(res.data, `manifest-${order.shipmentId}.pdf`);
            toast.success('Manifest downloaded');
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const urgent = isUrgent(order.dispatchBy);

    return (
        <motion.div
            className={`bg-white border rounded-2xl p-4 space-y-3 transition-colors ${selected ? 'border-brand-400 ring-1 ring-brand-400' : 'border-slate-200'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
        >
            {/* Header row */}
            <div className="flex items-start gap-2">
                <button
                    onClick={() => onToggleSelect(order)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
                >
                    {selected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
                </button>

                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-mono text-xs text-slate-500 truncate">{order.shipmentId || order.orderId}</p>
                        {order.orderId && order.shipmentId && (
                            <p className="text-xs text-slate-400 truncate">Order: {order.orderId}</p>
                        )}
                    </div>
                    <Badge className={STATUS_COLORS[order.status] ?? 'text-slate-500 bg-slate-50 border-slate-200'}>
                        {order.status || 'UNKNOWN'}
                    </Badge>
                </div>
            </div>

            {/* Items */}
            {order.items?.length > 0 && (
                <div className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2 space-y-0.5">
                    {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between gap-2">
                            <span className="truncate">{item.title || 'Item'}</span>
                            <span className="shrink-0 text-slate-400">×{item.qty}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {order.orderDate && (
                    <span className="text-slate-400">Ordered: {formatDate(order.orderDate)}</span>
                )}
                {order.dispatchBy && (
                    <span className={urgent ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                        {urgent ? '⚠ ' : ''}Dispatch by: {formatDate(order.dispatchBy)}
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
                {order.status === 'APPROVED' && !showPack && !showCancel && (
                    <>
                        <button
                            onClick={() => setShowPack(true)}
                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Package size={12} /> Pack
                        </button>
                        <button
                            onClick={() => setShowCancel(true)}
                            className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <XCircle size={12} /> Cancel
                        </button>
                    </>
                )}

                {order.status === 'PACKED' && (
                    <button
                        onClick={() => dispatchMutation.mutate()}
                        disabled={dispatchMutation.isPending}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {dispatchMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                        Mark Ready to Dispatch
                    </button>
                )}

                {order.status === 'READY_TO_DISPATCH' && (
                    <>
                        <button
                            onClick={() => labelsMutation.mutate()}
                            disabled={labelsMutation.isPending}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {labelsMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            Label
                        </button>
                        <button
                            onClick={() => manifestMutation.mutate()}
                            disabled={manifestMutation.isPending}
                            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {manifestMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                            Manifest
                        </button>
                    </>
                )}
            </div>

            {/* Inline forms */}
            <AnimatePresence>
                {showPack && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                    >
                        <PackForm
                            shipment={order} sellerId={sellerId} accountId={accountId}
                            onSuccess={() => { setShowPack(false); onRefetch(); }}
                            onCancel={() => setShowPack(false)}
                        />
                    </motion.div>
                )}
                {showCancel && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                    >
                        <CancelForm
                            shipment={order} sellerId={sellerId} accountId={accountId}
                            onSuccess={() => { setShowCancel(false); onRefetch(); }}
                            onCancel={() => setShowCancel(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────

export function FlipkartOrdersPage() {
    const { sellerId, accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('active');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkPackOrders, setBulkPackOrders] = useState(null);

    const tabConfig = TABS.find((t) => t.key === activeTab);

    const { data, isFetching, error, refetch } = useQuery({
        queryKey: ['flipkart-orders', accountId, activeTab],
        queryFn: () => accountsApi.getOrders(sellerId, accountId, {
            type:   tabConfig.type,
            states: activeTab === 'active' ? ACTIVE_STATES : undefined,
        }),
        select:    (res) => res.data.data,
        staleTime: 60 * 1000,
    });

    const orders  = data?.orders  ?? [];
    const hasMore = data?.hasMore ?? false;

    const selectedOrders = useMemo(
        () => orders.filter((o) => selectedIds.has(o.shipmentId || o.orderId)),
        [orders, selectedIds]
    );

    const toggleSelect = (order) => {
        const key = order.shipmentId || order.orderId;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const selectAll    = () => setSelectedIds(new Set(orders.map((o) => o.shipmentId || o.orderId)));
    const clearSelection = () => setSelectedIds(new Set());

    const handleTabChange = (key) => { setActiveTab(key); clearSelection(); };
    const handleRefetch   = () => { clearSelection(); refetch(); };

    // All READY_TO_DISPATCH in current view — for header manifest button
    const allReadyIds = orders.filter((o) => o.status === 'READY_TO_DISPATCH').map((o) => o.shipmentId);

    const manifestAllMutation = useMutation({
        mutationFn: () => accountsApi.downloadManifest(sellerId, accountId, allReadyIds),
        onSuccess: (res) => {
            triggerDownload(res.data, `manifest-all-${Date.now()}.pdf`);
            toast.success('Manifest downloaded');
        },
        onError: (err) => toast.error(extractError(err)),
    });

    return (
        <div className="space-y-4">
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
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br from-yellow-50 to-lime-50 border-yellow-200">
                    <ShoppingBag size={22} className="text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900">Flipkart Orders</h1>
                    <p className="text-sm text-slate-400 truncate">Account: {accountId}</p>
                </div>
                <div className="flex items-center gap-2">
                    {allReadyIds.length > 0 && selectedIds.size === 0 && (
                        <button
                            onClick={() => manifestAllMutation.mutate()}
                            disabled={manifestAllMutation.isPending}
                            title={`Download manifest for all ${allReadyIds.length} ready-to-dispatch shipments`}
                            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                        >
                            {manifestAllMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                            Manifest ({allReadyIds.length})
                        </button>
                    )}
                    <button
                        onClick={handleRefetch}
                        disabled={isFetching}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
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
                    <span>{extractError(error)}</span>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-gradient-to-br from-yellow-50 to-lime-50 border-yellow-200">
                        <ShoppingBag size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">No {tabConfig.label.toLowerCase()}</p>
                        <p className="text-sm text-slate-400 mt-1">
                            {activeTab === 'active' ? 'No active orders awaiting processing' : `No ${tabConfig.label.toLowerCase()} found`}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Bulk action bar */}
                    <AnimatePresence>
                        {selectedIds.size > 0 && (
                            <BulkActionBar
                                selectedOrders={selectedOrders}
                                sellerId={sellerId}
                                accountId={accountId}
                                onSuccess={handleRefetch}
                                onClearSelection={clearSelection}
                                onBulkPack={(approvedOrders) => setBulkPackOrders(approvedOrders)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Count + select all row */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {isFetching
                                ? 'Refreshing...'
                                : `${orders.length} order${orders.length !== 1 ? 's' : ''}${hasMore ? '+' : ''}`}
                        </p>
                        <button
                            onClick={selectedIds.size === orders.length ? clearSelection : selectAll}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
                        >
                            {selectedIds.size === orders.length
                                ? <><CheckSquare size={13} className="text-brand-600" /> Deselect all</>
                                : <><Square size={13} /> Select all</>
                            }
                        </button>
                    </div>

                    {/* Orders grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.shipmentId || order.orderId}
                                order={order}
                                sellerId={sellerId}
                                accountId={accountId}
                                onRefetch={handleRefetch}
                                selected={selectedIds.has(order.shipmentId || order.orderId)}
                                onToggleSelect={toggleSelect}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <p className="text-center text-xs text-slate-400 pt-2">
                            Showing first {orders.length} orders. Use filters to narrow results.
                        </p>
                    )}
                </div>
            )}

            {/* Bulk Pack Modal */}
            <AnimatePresence>
                {bulkPackOrders && (
                    <BulkPackModal
                        orders={bulkPackOrders}
                        sellerId={sellerId}
                        accountId={accountId}
                        onSuccess={() => { setBulkPackOrders(null); handleRefetch(); }}
                        onClose={() => setBulkPackOrders(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
