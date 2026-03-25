import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Plus, Store, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sellersApi } from '../api/sellers';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { extractError, STATUS_COLORS, formatDate } from '../lib/utils';

const schema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

function SellerForm({ defaultValues, onSubmit, loading, isEdit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { status: 'active' },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Seller Name" placeholder="e.g. Acme Corp" error={errors.name?.message} {...register('name')} />
      <Textarea label="Description" placeholder="Optional description..." error={errors.description?.message} {...register('description')} />
      {isEdit && (
        <Select
          label="Status"
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          {...register('status')}
        />
      )}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Seller'}
        </Button>
      </div>
    </form>
  );
}

function SellerRow({ seller, onEdit, onDelete, onView }) {
  return (
    <motion.tr
      className="border-b border-slate-100 hover:bg-brand-50/40 transition-colors cursor-pointer group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => onView(seller.id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand-100 border border-slate-200 group-hover:border-brand-200 flex items-center justify-center text-sm font-bold text-slate-600 group-hover:text-brand-700 shrink-0 transition-all">
            {seller.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800 text-sm group-hover:text-brand-700 transition-colors">{seller.name}</p>
            {seller.description && (
              <p className="text-xs text-slate-400 truncate max-w-xs">{seller.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={STATUS_COLORS[seller.status]}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {seller.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(seller.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(seller)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(seller)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export function SellersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editSeller, setEditSeller] = useState(null);
  const [deleteSeller, setDeleteSeller] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sellers', { page, search }],
    queryFn: () => sellersApi.list({ page, limit: 10, search: search || undefined }),
    select: (res) => res.data.data,
    keepPreviousData: true,
  });

  const createMut = useMutation({
    mutationFn: (v) => sellersApi.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); toast.success('Seller created'); setCreateOpen(false); },
    onError: (err) => toast.error(extractError(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...v }) => sellersApi.update(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); toast.success('Seller updated'); setEditSeller(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => sellersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); toast.success('Seller deleted'); setDeleteSeller(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sellers"
        subtitle={`${data?.pagination?.total ?? 0} total sellers`}
        action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Seller</Button>}
      />

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input-base pl-9" placeholder="Search sellers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : data?.sellers?.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No sellers found"
            description={search ? 'Try a different search term' : 'Create your first seller'}
            action={!search && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Seller</Button>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Seller', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sellers.map((seller) => (
                  <SellerRow
                    key={seller.id}
                    seller={seller}
                    onEdit={setEditSeller}
                    onDelete={setDeleteSeller}
                    onView={(id) => navigate(`/sellers/${id}`)}
                  />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3">
              <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Seller">
        <SellerForm onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>

      <Modal open={!!editSeller} onClose={() => setEditSeller(null)} title="Edit Seller">
        {editSeller && (
          <SellerForm
            isEdit
            defaultValues={{ name: editSeller.name, description: editSeller.description, status: editSeller.status }}
            onSubmit={(v) => updateMut.mutate({ id: editSeller.id, ...v })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteSeller}
        onClose={() => setDeleteSeller(null)}
        onConfirm={() => deleteMut.mutate(deleteSeller?.id)}
        loading={deleteMut.isPending}
        title="Delete Seller"
        message={`Are you sure you want to delete "${deleteSeller?.name}"? All associated platform accounts will also be removed.`}
      />
    </div>
  );
}
