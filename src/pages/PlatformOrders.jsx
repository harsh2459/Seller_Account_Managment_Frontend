import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ShoppingCart, ShoppingBag, Package, ArrowLeft,
    Store, ChevronRight,
} from 'lucide-react';
import { sellersApi } from '../api/sellers';
import { accountsApi } from '../api/accounts';
import { Spinner } from '../components/ui/Spinner';
import { PLATFORM_LABELS, STATUS_COLORS, formatDate } from '../lib/utils';
import { Badge } from '../components/ui/Badge';

const PLATFORM_CONFIG = {
    amazon:   { icon: ShoppingCart, title: 'Amazon'   },
    flipkart: { icon: ShoppingBag,  title: 'Flipkart' },
    meesho:   { icon: Package,      title: 'Meesho'   },
};

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

    const handleRowClick = (seller, account) => {
        if (platform === 'flipkart' || platform === 'amazon') {
            navigate(`/orders/${platform}/${seller.id}/${account.id}`);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <PlatformIcon size={16} className="text-slate-600" />
                </div>
                <h1 className="text-[20px] font-medium text-slate-900 flex-1">{config.title}</h1>
                {!isLoading && (
                    <span className="text-[13px] text-slate-400">
                        {platformData.length} seller{platformData.length !== 1 ? 's' : ''}
                    </span>
                )}
            </motion.div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : platformData.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <PlatformIcon size={18} className="text-slate-400" />
                    </div>
                    <p className="text-[14px] font-medium text-slate-600">No {config.title} accounts</p>
                    <p className="text-[13px] text-slate-400">No sellers have connected {config.title} yet</p>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1.4fr_1.6fr_100px_130px_32px] gap-4 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                        {['NAME', 'ACCOUNT ID', 'EMAIL', 'STATUS', 'LAST SYNCED', ''].map((h) => (
                            <span key={h} className="text-[11px] font-semibold text-brand-500 uppercase tracking-wider truncate">
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    {platformData.map(({ seller, account }, i) => (
                        <motion.div
                            key={account.id}
                            className="grid grid-cols-[1fr_1.4fr_1.6fr_100px_130px_32px] gap-4 px-4 py-3 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors group"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleRowClick(seller, account)}
                        >
                            {/* NAME */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                    {seller.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-slate-800 truncate">{seller.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                        {account.nickname || PLATFORM_LABELS[account.platform]}
                                    </p>
                                </div>
                            </div>

                            {/* ACCOUNT ID */}
                            <p className="text-[12px] font-mono text-brand-500 truncate">{account.id}</p>

                            {/* EMAIL */}
                            <p className="text-[12px] text-slate-500 truncate">
                                {account.platform_email || '—'}
                            </p>

                            {/* STATUS */}
                            <Badge className={STATUS_COLORS[account.status]}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                {account.status}
                            </Badge>

                            {/* LAST SYNCED */}
                            <p className="text-[12px] text-slate-400">
                                {account.last_synced_at ? formatDate(account.last_synced_at) : '—'}
                            </p>

                            {/* Arrow */}
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 transition-colors justify-self-end" />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
