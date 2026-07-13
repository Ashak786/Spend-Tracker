import React, { useState } from 'react';
import { UserProfile } from '../types';
import { formatCurrency } from '../utils';
import { Users, Plus, Edit2, Check, X, Trash2, Camera } from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 120, maxHeight = 120): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as jpeg to keep data footprint extremely lightweight (<10KB)
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface UserProfileManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string, salary: number, incentive?: number | null, photoUrl?: string) => void;
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
  const [editPhoto, setEditPhoto] = useState<string | undefined>(currentUser.photoUrl);
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);

  // Keep edit fields in sync when switching profiles or updating profile from DB
  React.useEffect(() => {
    setEditName(currentUser.name);
    setEditSalary(currentUser.salary.toString());
    setEditIncentive(currentUser.incentive?.toString() || '');
    setEditPhoto(currentUser.photoUrl);
    setEditError(null);
  }, [currentUser.id, currentUser.name, currentUser.salary, currentUser.incentive, currentUser.photoUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNewProfile: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support up to 10MB uploads but compress them immediately for super fast performance!
    if (file.size > 10 * 1024 * 1024) {
      if (isNewProfile) {
        setAddError('Image size must be less than 10MB.');
      } else {
        setEditError('Image size must be less than 10MB.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        try {
          const compressed = await compressImage(event.target.result, 120, 120);
          if (isNewProfile) {
            setNewPhoto(compressed);
            setAddError(null);
          } else {
            setEditPhoto(compressed);
            setEditError(null);
          }
        } catch (err) {
          console.error("Failed compressing uploaded image:", err);
          if (isNewProfile) {
            setAddError('Failed to process image.');
          } else {
            setEditError('Failed to process image.');
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

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
      isNaN(incentiveNum ?? NaN) ? null : incentiveNum,
      newPhoto
    );
    setNewName('');
    setNewSalary('');
    setNewIncentive('');
    setNewPhoto(undefined);
    setAddError(null);
    setIsAdding(false);
  };

  const handleStartEdit = () => {
    setEditName(currentUser.name);
    setEditSalary(currentUser.salary.toString());
    setEditIncentive(currentUser.incentive?.toString() || '');
    setEditPhoto(currentUser.photoUrl);
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
      photoUrl: editPhoto,
    });
    setEditError(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/90 dark:hover:border-white/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Switch Active Profile
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
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
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all border shadow-sm cursor-pointer ${
                isEditMode
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-transform hover:scale-105 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New User
            </button>
          </div>
        )}
      </div>

      {/* Adding profile form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-5 mb-6 shadow-inner">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">
            Create Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
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
                className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xs text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Monthly Base Salary (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={newSalary}
                  onChange={e => setNewSalary(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Incentive / Bonus (INR, Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={newIncentive}
                  onChange={e => setNewIncentive(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Profile Photo (Optional)
              </label>
              <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xs p-3 border border-slate-200/60 dark:border-white/10 rounded-2xl">
                <div className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {newPhoto ? (
                    <img src={newPhoto} alt="New profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    Choose from Gallery
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, true)}
                    />
                  </label>
                  {newPhoto && (
                    <button
                      type="button"
                      onClick={() => setNewPhoto(undefined)}
                      className="text-[10px] font-bold text-rose-500 hover:underline self-start cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {addError && (
            <div className="mb-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl px-4 py-2.5 flex items-center gap-1.5 animate-fade-in">
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
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
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
              className={`relative rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between p-4 sm:p-5 ${
                isSelected
                  ? 'border-blue-500/80 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-md scale-[1.02] backdrop-blur-sm'
                  : 'border-white/50 dark:border-white/10 bg-white/30 dark:bg-slate-900/20 backdrop-blur-xs opacity-80 hover:opacity-100 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                {isEditing && isSelected ? (
                  <div className="space-y-2 w-full pr-8">
                    <div className="flex items-center gap-3 mb-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="relative group/avatar w-12 h-12 shrink-0">
                        <img
                          src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-xl cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, false)}
                          />
                        </label>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Profile Photo</span>
                        <div className="flex gap-2">
                          <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(e, false)}
                            />
                          </label>
                          {editPhoto && (
                            <button
                              type="button"
                              onClick={() => setEditPhoto(undefined)}
                              className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Name</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => {
                          setEditName(e.target.value);
                          if (editError) setEditError(null);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Base Salary</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={editSalary}
                          onChange={e => setEditSalary(e.target.value)}
                          className="text-xs px-6 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Incentive / Bonus (Optional)</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={editIncentive}
                          onChange={e => setEditIncentive(e.target.value)}
                          placeholder="0"
                          className="text-xs px-6 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    {editError && (
                      <p className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-lg px-2 py-1 mt-1 animate-fade-in">
                        {editError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[140px]">
                        {u.name}
                      </h3>
                      <p className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 mt-0.5" title="Total effective monthly income">
                        {formatCurrency(u.salary + (u.incentive || 0))}
                      </p>
                      {u.incentive ? (
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-0.5">
                          <div>Base: {formatCurrency(u.salary)}</div>
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">+ Inc / Bonus: {formatCurrency(u.incentive)}</div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Base Salary</p>
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
                          <div className="flex gap-1 absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200 dark:border-white/10 rounded-xl p-0.5">
                            <button
                              onClick={handleSaveEdit}
                              title="Save Changes"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                { setIsEditing(false); setEditError(null); }
                              }}
                              title="Cancel"
                              className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartEdit}
                            title="Edit Profile"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Delete (only show for non-selected users or if there is > 1 user) */}
                    {users.length > 1 && !isEditing && (
                      deletingId === u.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg p-0.5 animate-fade-in shrink-0">
                          <button
                            onClick={() => {
                              onDeleteUser(u.id);
                              setDeletingId(null);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md transition-colors cursor-pointer"
                            title="Confirm Delete"
                          >
                            <Check className="w-3 h-3 font-bold" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(u.id)}
                          title="Delete Profile"
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {!isEditing || !isSelected ? (
                <div className="mt-2 pt-3 border-t border-slate-150/50 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {isSelected ? 'Active Account' : 'Inactive'}
                  </span>
                  {!isSelected && (
                    <button
                      onClick={() => onSelectUser(u.id)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/30 rounded-xl transition-all cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                  {isSelected && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
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
