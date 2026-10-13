import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category, TransactionType } from '../types/finance';
import { EMOJI_CATALOG, extractFirstEmoji } from '../utils/emojiData';
import { ConfirmModal } from './ConfirmModal';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Smile,
  Search,
  Smartphone,
  Check,
  Tag,
} from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('gasto');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('gasto');
  const [selectedIcon, setSelectedIcon] = useState<string>('✨');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState<string>('');
  const [phoneEmojiInput, setPhoneEmojiInput] = useState<string>('');
  const [emojiSearch, setEmojiSearch] = useState<string>('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Open Form for creating
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setSelectedIcon(activeTab === 'gasto' ? '🥑' : activeTab === 'ingreso' ? '💼' : '⭐');
    setSubcategories([]);
    setNewSubcategoryInput('');
    setPhoneEmojiInput('');
    setIsFormOpen(true);
  };

  // Open Form for editing
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setSelectedIcon(cat.icon_or_image_url || '💰');
    setSubcategories([...cat.subcategories]);
    setNewSubcategoryInput('');
    setPhoneEmojiInput('');
    setIsFormOpen(true);
  };

  // Subcategory chip management
  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim();
    if (trimmed && !subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed]);
      setNewSubcategoryInput('');
    }
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  // Mobile phone emoji input handler
  const handlePhoneEmojiChange = (val: string) => {
    setPhoneEmojiInput(val);
    const parsed = extractFirstEmoji(val);
    if (parsed) {
      setSelectedIcon(parsed);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        icon_or_image_url: selectedIcon,
        subcategories,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type,
        icon_or_image_url: selectedIcon,
        subcategories,
      });
    }

    setIsFormOpen(false);
  };

  // Filter emojis by search
  const filteredEmojiGroups = EMOJI_CATALOG.map((group) => {
    const q = emojiSearch.trim().toLowerCase();
    if (!q) return group;
    const filtered = group.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
    return { ...group, items: filtered };
  }).filter((group) => group.items.length > 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/35 backdrop-blur-xs">
        <div className="bg-white w-full max-w-xl rounded-3xl border border-[#EDE8DF] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F0EBE1]">
            <div>
              <h2 className="text-lg font-bold text-[#2D2721]">
                {isFormOpen
                  ? editingCategory
                    ? 'Editar Categoría'
                    : 'Nueva Categoría'
                  : 'Administrar Categorías'}
              </h2>
              <p className="text-xs text-[#7A7267]">
                {isFormOpen
                  ? 'Personaliza el nombre, icono y subcategorías'
                  : 'Organiza tus gastos, ingresos y ahorros a tu medida'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {!isFormOpen ? (
            /* LIST VIEW */
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
              {/* Type Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5EFE6] rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('gasto')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'gasto'
                      ? 'bg-[#FDECE8] text-[#8B2E2E] border border-[#F5C2BC] shadow-2xs'
                      : 'text-[#7A7267] hover:text-[#2D2721]'
                  }`}
                >
                  Gastos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ingreso')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'ingreso'
                      ? 'bg-[#EBF1E6] text-[#3B4B2E] border border-[#D3E1CB] shadow-2xs'
                      : 'text-[#7A7267] hover:text-[#2D2721]'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ahorro')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'ahorro'
                      ? 'bg-[#FCF6E5] text-[#614E15] border border-[#F2E4BD] shadow-2xs'
                      : 'text-[#7A7267] hover:text-[#2D2721]'
                  }`}
                >
                  Ahorros
                </button>
              </div>

              {/* Add New Category Button */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full mb-4 py-2.5 px-4 rounded-xl border border-dashed border-[#C4B2D8] bg-[#FAF8FC] hover:bg-[#F4EDFA] text-[#9678B6] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <Plus size={16} />
                <span>Crear Categoría de {activeTab === 'gasto' ? 'Gasto' : activeTab === 'ingreso' ? 'Ingreso' : 'Ahorro'}</span>
              </button>

              {/* Categories list */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {categories
                  .filter((c) => c.type === activeTab)
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-2xl border border-[#EDE8DF] bg-white hover:border-[#DCD5C9] transition-all flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-[#FAF8F5] border border-[#F0EBE1]">
                          {cat.icon_or_image_url}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#2D2721] truncate">
                            {cat.name}
                          </h4>
                          {cat.subcategories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cat.subcategories.map((sub, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] text-[#7A7267] bg-[#F5EFE6] px-2 py-0.5 rounded-md"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#9E9588] italic">
                              Sin subcategorías específicas
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:text-[#2D2721] hover:bg-[#F5EFE6] transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(cat.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:text-[#8B2E2E] hover:bg-[#FDECE8] transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}

                {categories.filter((c) => c.type === activeTab).length === 0 && (
                  <div className="text-center py-8 text-xs text-[#8E867B]">
                    No tienes categorías creadas para esta sección.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* FORM VIEW (CREATE / EDIT) */
            <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                  Tipo de Categoría
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5EFE6] rounded-xl">
                  {(['gasto', 'ingreso', 'ahorro'] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                        type === t
                          ? 'bg-white text-[#2D2721] shadow-2xs'
                          : 'text-[#7A7267]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Icon Row */}
              <div className="flex items-start gap-3">
                {/* Icon Button */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                    Icono
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className="w-14 h-11 rounded-xl border border-[#DDD6C8] bg-white flex items-center justify-center text-2xl hover:bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#9678B6]"
                    title="Elegir emoji"
                  >
                    {selectedIcon}
                  </button>
                </div>

                {/* Name Input */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alimentación, Sueldo, Viajes..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-xs font-medium text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                  />
                </div>
              </div>

              {/* EMOJI PICKER DRAWER / SECTION */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE8DF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2721] flex items-center gap-1.5">
                    <Smile size={15} className="text-[#9678B6]" />
                    <span>Selector de Emojis e Íconos</span>
                  </span>
                  <span className="text-[11px] text-[#7A7267]">
                    Seleccionado: <strong className="text-base ml-1">{selectedIcon}</strong>
                  </span>
                </div>

                {/* Mobile Phone Native Emoji Input */}
                <div className="bg-white p-2.5 rounded-xl border border-[#DDD6C8]">
                  <label className="block text-[11px] font-semibold text-[#5A5247] mb-1 flex items-center gap-1">
                    <Smartphone size={13} className="text-[#9678B6]" />
                    <span>📱 Usar emoji de tu celular</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Toca aquí para abrir el teclado de emojis de tu celular o pega uno..."
                    value={phoneEmojiInput}
                    onChange={(e) => handlePhoneEmojiChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#EDE8DF] focus:outline-none focus:border-[#9678B6]"
                  />
                  <p className="text-[10px] text-[#8E867B] mt-1">
                    En celular abre el teclado nativo con soporte de emojis compuestos (tonos, profesiones, etc.)
                  </p>
                </div>

                {/* Search Bar for Emoji Catalog */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9184]" />
                  <input
                    type="text"
                    placeholder="Buscar emoji (ej: café, auto, super, gym, sueldo, perro)..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD6C8] bg-white text-xs text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                  />
                </div>

                {/* Categorized Emojis Grid */}
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {filteredEmojiGroups.map((group) => (
                    <div key={group.category}>
                      <span className="text-[10px] font-bold text-[#8E867B] uppercase tracking-wider block mb-1">
                        {group.category}
                      </span>
                      <div className="grid grid-cols-8 gap-1.5">
                        {group.items.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedIcon(item.emoji)}
                            className={`h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white hover:scale-110 transition-all ${
                              selectedIcon === item.emoji
                                ? 'bg-white ring-2 ring-[#9678B6] shadow-2xs'
                                : ''
                            }`}
                            title={item.name}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategories Editor */}
              <div>
                <label className="block text-xs font-semibold text-[#5A5247] mb-1.5 flex items-center gap-1">
                  <Tag size={13} className="text-[#9678B6]" />
                  <span>Subcategorías personalizadas</span>
                </label>

                {/* Existing Subcategory Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[30px] p-2 rounded-xl bg-[#FAF8F5] border border-[#EDE8DF]">
                  {subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DDD6C8] text-xs text-[#2D2721] shadow-2xs"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(idx)}
                        className="text-[#9A9184] hover:text-[#8B2E2E] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {subcategories.length === 0 && (
                    <span className="text-[11px] text-[#9A9184] italic self-center">
                      Aún no agregaste subcategorías.
                    </span>
                  )}
                </div>

                {/* Add Subcategory input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva subcategoría (ej: Combustible, Farmacia)..."
                    value={newSubcategoryInput}
                    onChange={(e) => setNewSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#DDD6C8] bg-white text-xs text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-3.5 py-2 bg-[#F4EDFA] hover:bg-[#E9DFF2] text-[#9678B6] font-bold text-xs rounded-xl border border-[#E9DFF2] transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7A7267] hover:bg-[#F5EFE6] rounded-xl transition-colors"
                >
                  Volver al listado
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="¿Eliminar esta categoría?"
        message="Se eliminará la categoría. Los movimientos existentes no se perderán pero ya no tendrán esta categoría asignada."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteCategory(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
};
