import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, ShieldCheck, Pencil, Trash2, Lock, UserX, UserCheck, Search } from 'lucide-react';
import { adminsApi } from '../api/admins';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { extractError, STATUS_COLORS, formatDate } from '../lib/utils';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['admin', 'super_admin']),
});

const editSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'super_admin']).optional(),
});

const resetSchema = z.object({ newPassword: z.string().min(8) });
const suspendSchema = z.object({ reason: z.string().optional() });

function AdminForm({ defaultValues, onSubmit, loading, isEdit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" placeholder="admin@example.com" error={errors.email?.message} {...register('email')} />
      {!isEdit && <Input label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />}
      <Select label="Role" options={[{ value: 'admin', label: 'Admin' }, { value: 'super_admin', label: 'Super Admin' }]} error={errors.role?.message} {...register('role')} />
      <div className="flex justify-end pt-2"><Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Admin'}</Button></div>
    </form>
  );
}

function ResetPasswordForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(resetSchema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="New Password" type="password" placeholder="Min 8 characters" error={errors.newPassword?.message} {...register('newPassword')} />
      <div className="flex justify-end pt-2"><Button type="submit" loading={loading}>Reset Password</Button></div>
    </form>
  );
}

function SuspendForm({ onSubmit, loading }) {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(suspendSchema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Reason (optional)" placeholder="Reason for suspension..." {...register('reason')} />
      <div className="flex justify-end pt-2"><Button type="submit" variant="danger" loading={loading}>Suspend Admin</Button></div>
    </form>
  );
}

export function AdminsPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [deleteAdmin, setDeleteAdmin] = useState(null);
  const [resetAdmin, setResetAdmin] = useState(null);
  const [suspendAdmin, setSuspendAdmin] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admins', { page }],
    queryFn: () => adminsApi.list({ page, limit: 10 }),
    select: (res) => res.data.data,
    keepPreviousData: true,
  });

  const filtered = (data?.admins ?? []).filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const createMut = useMutation({
    mutationFn: (v) => adminsApi.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Admin created'); setCreateOpen(false); },
    onError: (err) => toast.error(extractError(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...v }) => adminsApi.update(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Admin updated'); setEditAdmin(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Admin deleted'); setDeleteAdmin(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const resetMut = useMutation({
    mutationFn: ({ id, newPassword }) => adminsApi.resetPassword(id, { newPassword }),
    onSuccess: () => { toast.success('Password reset'); setResetAdmin(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, ...v }) => adminsApi.suspend(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Admin suspended'); setSuspendAdmin(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const unsuspendMut = useMutation({
    mutationFn: (id) => adminsApi.unsuspend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Admin unsuspended'); },
    onError: (err) => toast.error(extractError(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        subtitle={`${data?.pagination?.total ?? 0} admins`}
        action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Admin</Button>}
      />

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input-base pl-9" placeholder="Search admins..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No admins found" description="Create the first admin user" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Admin', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((admin, i) => (
                  <motion.tr
                    key={admin.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700">
                          {admin.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
                            {admin.name}
                            {admin.id === me?.id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 border border-brand-200">You</span>}
                          </p>
                          <p className="text-xs text-slate-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={admin.role === 'super_admin' ? 'text-brand-700 bg-brand-50 border-brand-200' : 'text-slate-600 bg-slate-100 border-slate-200'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[admin.status]}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{admin.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(admin.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditAdmin(admin)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><Pencil size={14} /></button>
                        <button onClick={() => setResetAdmin(admin)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><Lock size={14} /></button>
                        {admin.status === 'suspended' ? (
                          <button onClick={() => unsuspendMut.mutate(admin.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><UserCheck size={14} /></button>
                        ) : (
                          <button onClick={() => setSuspendAdmin(admin)} disabled={admin.id === me?.id} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><UserX size={14} /></button>
                        )}
                        <button onClick={() => setDeleteAdmin(admin)} disabled={admin.id === me?.id} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3">
              <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Admin">
        <AdminForm defaultValues={{ role: 'admin' }} onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>
      <Modal open={!!editAdmin} onClose={() => setEditAdmin(null)} title="Edit Admin">
        {editAdmin && <AdminForm isEdit defaultValues={{ name: editAdmin.name, email: editAdmin.email, role: editAdmin.role }} onSubmit={(v) => updateMut.mutate({ id: editAdmin.id, ...v })} loading={updateMut.isPending} />}
      </Modal>
      <Modal open={!!resetAdmin} onClose={() => setResetAdmin(null)} title={`Reset Password — ${resetAdmin?.name}`} size="sm">
        {resetAdmin && <ResetPasswordForm onSubmit={(v) => resetMut.mutate({ id: resetAdmin.id, ...v })} loading={resetMut.isPending} />}
      </Modal>
      <Modal open={!!suspendAdmin} onClose={() => setSuspendAdmin(null)} title={`Suspend — ${suspendAdmin?.name}`} size="sm">
        {suspendAdmin && <SuspendForm onSubmit={(v) => suspendMut.mutate({ id: suspendAdmin.id, ...v })} loading={suspendMut.isPending} />}
      </Modal>
      <ConfirmDialog open={!!deleteAdmin} onClose={() => setDeleteAdmin(null)} onConfirm={() => deleteMut.mutate(deleteAdmin?.id)} loading={deleteMut.isPending} title="Delete Admin" message={`Delete admin "${deleteAdmin?.name}"? This action cannot be undone.`} />
    </div>
  );
}
