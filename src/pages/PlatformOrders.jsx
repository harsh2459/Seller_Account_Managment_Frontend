import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ShoppingCart, ShoppingBag, Package, ArrowLeft,
    RefreshCw, Store, ChevronRight,
} from 'lucide-react';
import { sellersApi } from '../api/sellers';
import { accountsApi } from '../api/accounts';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { PLATFORM_LABELS, STATUS_COLORS, formatDate } from '../lib/utils';

const PLATFORM_CONFIG = {
    amazon: {
        icon: ShoppingCart,
        bg: 'from-orange-50 to-amber-50 border-orange-200',
        iconColor: 'text-orange-600',
        title: 'Amazon',
        description: 'All sellers connected to Amazon marketplace',
    },
    flipkart: {
        icon: ShoppingBag,
        bg: 'from-yellow-50 to-lime-50 border-yellow-200',
        iconColor: 'text-yellow-600',
        title: 'Flipkart',
        description: 'All sellers connected to Flipkart marketplace',
    },
    meesho: {
        icon: Package,
        bg: 'from-pink-50 to-rose-50 border-pink-200',
        iconColor: 'text-pink-600',
        title: 'Meesho',
        description: 'All sellers connected to Meesho marketplace',
    },
};

function SellerAccountCard({ seller, account, platform, index }) {
    const navigate = useNavigate();
    const config = PLATFORM_CONFIG[account.platform];

    const handleClick = () => {
        if (platform === 'flipkart' || platform === 'amazon') {
            navigate(`/orders/${platform}/${seller.id}/${account.id}`);
        }
    };

    return (
        <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 cursor-pointer group"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2, boxShadow: '0 4px 16px -2px rgb(0 0 0 / 0.12)' }}
            onClick={handleClick}
        >
            {/* Seller info */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {seller.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{seller.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                        {account.nickname || account.platform_email || PLATFORM_LABELS[account.platform] + ' Account'}
                    </p>
                </div>
                <Badge className={STATUS_COLORS[account.status]}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {account.status}
                </Badge>
            </div>

            {/* Account meta */}
            <div className="space-y-1.5">
                {account.platform_email && (
                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 truncate">
                        📧 {account.platform_email}
                    </div>
                )}
                {account.last_synced_at && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <RefreshCw size={10} /> Last synced: {formatDate(account.last_synced_at)}
                    </div>
                )}
            </div>

            {/* Click hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-brand-600 transition-colors pt-1 border-t border-slate-100">
                <span>View &amp; manage orders</span>
                <ChevronRight size={13} />
            </div>
        </motion.div>
    );
}

export function PlatformOrdersPage() {
    const { platform } = useParams();
    const navigate = useNavigate();
    const config = PLATFORM_CONFIG[platform];
    const PlatformIcon = config?.icon ?? Store;

    const { data: sellers = [], isLoading: sellersLoading } = useQuery({
        queryKey: ['sellers-all'],
        queryFn: () => sellersApi.list({ limit: 100 }),
        select: (res) => res.data.data?.sellers ?? [],
    });

    const { data: platformData = [], isLoading: accountsLoading } = useQuery({
        queryKey: ['platform-accounts', platform, sellers.map((s) => s.id).join(',')],
        queryFn: async () => {
            if (!sellers.length) return [];
            const results = await Promise.all(
                sellers.map((s) =>
                    accountsApi.list(s.id)
                        .then((r) => {
                            const accs = r.data.data?.accounts ?? [];
                            return accs
                                .filter((a) => a.platform === platform)
                                .map((a) => ({ seller: s, account: a }));
                        })
                        .catch(() => [])
                )
            );
            return results.flat();
        },
        enabled: sellers.length > 0,
    });

    const isLoading = sellersLoading || accountsLoading;

    if (!config) {
        return <div className="text-center py-16 text-slate-400">Unknown platform</div>;
    }

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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${config.bg}`}>
                    <PlatformIcon size={22} className={config.iconColor} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
                    <p className="text-sm text-slate-400">{config.description}</p>
                </div>
                <div className="ml-auto">
                    <div className={`px-4 py-2 rounded-xl border text-sm font-semibold bg-gradient-to-br ${config.bg} ${config.iconColor}`}>
                        {isLoading ? '...' : platformData.length} seller{platformData.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </motion.div>

            {/* Platform badge strip */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-r ${config.bg}`}>
                <PlatformIcon size={18} className={config.iconColor} />
                <p className="text-sm font-medium text-slate-700">
                    Click on a seller account to view and manage their orders on{' '}
                    <span className={`font-bold ${config.iconColor}`}>{config.title}</span>
                </p>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : platformData.length === 0 ? (
                <div className="card p-12 flex flex-col items-center gap-4 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${config.bg}`}>
                        <PlatformIcon size={24} className={config.iconColor} />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">No {config.title} accounts</p>
                        <p className="text-sm text-slate-400 mt-1">
                            No sellers have connected their {config.title} account yet
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {platformData.map(({ seller, account }, i) => (
                        <SellerAccountCard
                            key={account.id}
                            seller={seller}
                            account={account}
                            platform={platform}
                            index={i}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
