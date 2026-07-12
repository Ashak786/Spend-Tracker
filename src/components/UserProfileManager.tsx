import React, { useState } from 'react';
import { UserProfile } from '../types';
import { formatCurrency } from '../utils';
import { Users, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

interface UserProfileManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string, salary: number, incentive?: number | null) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserProfileManager({
  users,
  currentUser,
  onSelectUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: UserProfileManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newIncentive, setNewIncentive] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Edit states for current user
  const [editName, setEditName] = useState(currentUser.name);
  const [editSalary, setEditSalary] = useState(currentUser.salary.toString());
  const [editIncentive, setEditIncentive] = useState(currentUser.incentive?.toString() || '');

  // Keep edit fields in sync when switching profiles or updating profile from DB
  React.useEffect(() => {
    setEditName(currentUser.name);
    setEditSalary(currentUser.salary.toString());
    setEditIncentive(currentUser.incentive?.toString() || '');
    setEditError(null);
  }, [currentUser.id, currentUser.name, currentUser.salary, currentUser.incentive]);

  // State to track profile ID that is currently in 'confirm-delete' state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSalary) return;
    const salaryNum = parseFloat(newSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) return;

    const incentiveNum = newIncentive ? parseFloat(newIncentive) : null;

    const trimmedName = newName.trim();
    const nameExists = users.some(u => u.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      setAddError(`An account for "${trimmedName}" already exists.`);
      return;
    }

    onAddUser(
      trimmedName,
      salaryNum,
      isNaN(incentiveNum ?? NaN) ? null : incentiveNum
    );
    setNewName('');
    setNewSalary('');
    setNewIncentive('');
    setAddError(null);
    setIsAdding(false);
  };

  const handleStartEdit = () => {
    setEditName(currentUser.name);
    setEditSalary(currentUser.salary.toString());
    setEditIncentive(currentUser.incentive?.toString() || '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const salaryNum = parseFloat(editSalary);
    if (!editName.trim() || isNaN(salaryNum) || salaryNum <= 0) return;

    const incentiveNum = editIncentive ? parseFloat(editIncentive) : null;

    const trimmedName = editName.trim();
    const nameExists = users.some(u => u.id !== currentUser.id && u.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      setEditError(`Account "${trimmedName}" already exists.`);
      return;
    }

    onUpdateUser({
      ...currentUser,
      name: trimmedName,
      salary: salaryNum,
      incentive: isNaN(incentiveNum ?? NaN) ? null : incentiveNum,
    });
    setEditError(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border-2 border-slate-200 hover:border-slate-300 transition-colors duration-300 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            Switch Active Profile
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Track expenses for different Users
          </p>
        </div>
        
        {!isAdding && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isEditMode) { setIsEditing(false); setEditError(null); }
                setIsEditMode(!isEditMode);
              }}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all border-2 shadow-sm ${
                isEditMode
                  ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Done Editing
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Users
                </>
              )}
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-transform hover:scale-105 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New User
            </button>
          </div>
        )}
      </div>

      {/* Adding profile form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 mb-6">
          <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
            Create Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Full Name / Username
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => {
                  setNewName(e.target.value);
                  if (addError) setAddError(null);
                }}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Monthly Base Salary (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={newSalary}
                  onChange={e => setNewSalary(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full text-sm pl-8 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Incentive / Bonus (INR, Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={newIncentive}
                  onChange={e => setNewIncentive(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm pl-8 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
          {addError && (
            <div className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {addError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setAddError(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors cursor-pointer"
            >
              Create Profile
            </button>
          </div>
        </form>
      )}

      {/* Switcher & Edit list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {users.map(u => {
          const isSelected = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`relative rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                  : 'border-slate-200/80 bg-slate-50/40 opacity-70 hover:opacity-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                {isEditing && isSelected ? (
                  <div className="space-y-2 w-full pr-8">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Name</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => {
                          setEditName(e.target.value);
                          if (editError) setEditError(null);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 border-2 border-slate-200 bg-white rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Base Salary</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={editSalary}
                          onChange={e => setEditSalary(e.target.value)}
                          className="text-xs px-6 py-1.5 border-2 border-slate-200 bg-white rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Incentive / Bonus (Optional)</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={editIncentive}
                          onChange={e => setEditIncentive(e.target.value)}
                          placeholder="0"
                          className="text-xs px-6 py-1.5 border-2 border-slate-200 bg-white rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    {editError && (
                      <p className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-200/50 rounded-lg px-2 py-1 mt-1 animate-fade-in">
                        {editError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
                        {u.name}
                      </h3>
                      <p className="text-xs font-mono font-black text-slate-800 mt-0.5" title="Total effective monthly income">
                        {formatCurrency(u.salary + (u.incentive || 0))}
                      </p>
                      {u.incentive ? (
                        <div className="text-[9px] text-slate-500 font-medium leading-normal mt-0.5">
                          <div>Base: {formatCurrency(u.salary)}</div>
                          <div className="text-teal-600 font-semibold">+ Inc / Bonus: {formatCurrency(u.incentive)}</div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium">Base Salary</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit Controls */}
                {isEditMode && (
                  <div className="flex gap-1">
                    {isSelected && (
                      <>
                        {isEditing ? (
                          <div className="flex gap-1 absolute top-3 right-3 bg-white/95 shadow-md border-2 border-slate-200 rounded-xl p-0.5">
                            <button
                              onClick={handleSaveEdit}
                              title="Save Changes"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditError(null);
                              }}
                              title="Cancel"
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartEdit}
                            title="Edit Profile"
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Delete (only show for non-selected users or if there is > 1 user) */}
                    {users.length > 1 && !isEditing && (
                      deletingId === u.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5 animate-fade-in shrink-0">
                          <button
                            onClick={() => {
                              onDeleteUser(u.id);
                              setDeletingId(null);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="Confirm Delete"
                          >
                            <Check className="w-3 h-3 font-bold" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(u.id)}
                          title="Delete Profile"
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {!isEditing || !isSelected ? (
                <div className="mt-2 pt-3 border-t-2 border-slate-100/50 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {isSelected ? 'Active Account' : 'Inactive'}
                  </span>
                  {!isSelected && (
                    <button
                      onClick={() => onSelectUser(u.id)}
                      className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-xl transition-all cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                  {isSelected && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
