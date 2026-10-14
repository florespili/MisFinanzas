import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Category, TransactionType } from '../types/finance';
import { EMOJI_CATALOG, extractFirstEmoji } from '../utils/emojiData';
import {
  compressAndResizeImage,
  validateImageUrl,
  isImageUrl,
} from '../utils/imageUtils';
import { uploadCategoryImage } from '../firebase/config';
import { ConfirmModal } from './ConfirmModal';
import { CategoryIcon } from './CategoryIcon';
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
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TransactionType>('gasto');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('gasto');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState<string>('');

  // Icon Mode: 'emoji' | 'image'
  const [iconMode, setIconMode] = useState<'emoji' | 'image'>('emoji');

  // 1. Emoji mode states
  const [selectedIcon, setSelectedIcon] = useState<string>('✨');
  const [phoneEmojiInput, setPhoneEmojiInput] = useState<string>('');
  const [emojiSearch, setEmojiSearch] = useState<string>('');

  // 2. Custom Image mode states
  const [imageSubTab, setImageSubTab] = useState<'upload' | 'url'>('upload');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedBlob, setUploadedBlob] = useState<Blob | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // URL state
  const [urlInput, setUrlInput] = useState<string>('');
  const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);
  const [urlValidationStatus, setUrlValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Deletion / Saving State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Open Form for creating
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    const defaultEmoji = activeTab === 'gasto' ? '🥑' : activeTab === 'ingreso' ? '💼' : '⭐';
    setSelectedIcon(defaultEmoji);
    setIconMode('emoji');
    setImageSubTab('upload');
    setUploadedPreview(null);
    setUploadedBlob(null);
    setFileError(null);
    setUrlInput('');
    setUrlValidationStatus('idle');
    setUrlError(null);
    setSubcategories([]);
    setNewSubcategoryInput('');
    setPhoneEmojiInput('');
    setEmojiSearch('');
    setIsFormOpen(true);
  };

  // Open Form for editing
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    const hasCustomImage = isImageUrl(cat.icon_or_image_url);

    if (hasCustomImage) {
      setIconMode('image');
      setSelectedIcon('🏷️');
      setUploadedPreview(cat.icon_or_image_url);
      setUploadedBlob(null);
      if (cat.icon_or_image_url.startsWith('http://') || cat.icon_or_image_url.startsWith('https://')) {
        setImageSubTab('url');
        setUrlInput(cat.icon_or_image_url);
        setUrlValidationStatus('valid');
      } else {
        setImageSubTab('upload');
        setUrlInput('');
        setUrlValidationStatus('idle');
      }
    } else {
      setIconMode('emoji');
      setSelectedIcon(cat.icon_or_image_url || '💰');
      setUploadedPreview(null);
      setUploadedBlob(null);
      setUrlInput('');
      setUrlValidationStatus('idle');
    }

    setFileError(null);
    setUrlError(null);
    setSubcategories([...cat.subcategories]);
    setNewSubcategoryInput('');
    setPhoneEmojiInput('');
    setEmojiSearch('');
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
      setIconMode('emoji');
    }
  };

  // File upload handler (from phone gallery or computer)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setFileError(null);
      const processed = await compressAndResizeImage(file, 140, 0.82);
      setUploadedPreview(processed.dataUrl);
      setUploadedBlob(processed.blob);
      setIconMode('image');
    } catch (err) {
      console.error('Error al procesar archivo de imagen:', err);
      setFileError(err instanceof Error ? err.message : 'Error al procesar la imagen seleccionada.');
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  // URL input and test handler
  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setUrlValidationStatus('idle');
    setUrlError(null);
  };

  const handleTestUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    setIsValidatingUrl(true);
    setUrlError(null);
    try {
      const isValid = await validateImageUrl(trimmed, 7000);
      if (isValid) {
        setUrlValidationStatus('valid');
        setUploadedPreview(trimmed);
        setIconMode('image');
      } else {
        setUrlValidationStatus('invalid');
        setUrlError(
          'No se pudo cargar la imagen desde este enlace. Asegúrate de copiar la URL directa del archivo de imagen (ej: que termine en .jpg, .png, .webp o .svg) y no el enlace de la página web.'
        );
      }
    } catch {
      setUrlValidationStatus('invalid');
      setUrlError('Error al intentar acceder a la imagen. Verifica que el enlace sea accesible públicamente.');
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Switch back to emoji and clear custom image
  const handleRemoveImage = () => {
    setIconMode('emoji');
    setUploadedPreview(null);
    setUploadedBlob(null);
    setUrlInput('');
    setUrlValidationStatus('idle');
    setFileError(null);
    setUrlError(null);
    if (!selectedIcon || selectedIcon === '🏷️') {
      setSelectedIcon(type === 'gasto' ? '🥑' : type === 'ingreso' ? '💼' : '⭐');
    }
  };

  // Form submit handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    try {
      setIsSaving(true);
      let finalIconOrImage = selectedIcon;

      if (iconMode === 'image') {
        if (uploadedBlob && uploadedPreview) {
          // If a new file was uploaded, try Firebase Storage with resilient fallback
          if (user) {
            finalIconOrImage = await uploadCategoryImage(
              user.uid,
              editingCategory?.id || '',
              uploadedBlob,
              uploadedPreview
            );
          } else {
            finalIconOrImage = uploadedPreview;
          }
        } else if (imageSubTab === 'url' && urlInput.trim() && urlValidationStatus === 'valid') {
          finalIconOrImage = urlInput.trim();
        } else if (uploadedPreview) {
          finalIconOrImage = uploadedPreview;
        } else {
          finalIconOrImage = selectedIcon || '🏷️';
        }
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          icon_or_image_url: finalIconOrImage,
          subcategories,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          icon_or_image_url: finalIconOrImage,
          subcategories,
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error al guardar categoría:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Live preview icon/image
  const currentPreviewValue =
    iconMode === 'image'
      ? uploadedPreview || (urlValidationStatus === 'valid' ? urlInput.trim() : null) || '🖼️'
      : selectedIcon;

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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto overscroll-contain-touch">
        <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border border-[#EDE8DF] shadow-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#F0EBE1] shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2D2721]">
                {isFormOpen
                  ? editingCategory
                    ? 'Editar Categoría'
                    : 'Nueva Categoría'
                  : 'Configuración de Categorías'}
              </h2>
              <p className="text-xs text-[#7A7267]">
                {isFormOpen
                  ? 'Personaliza el nombre, tipo, emojis, imágenes y subcategorías.'
                  : 'Organiza tus ingresos, gastos y ahorros con íconos o imágenes.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {!isFormOpen ? (
            /* LIST VIEW */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain-touch px-4 sm:px-6 py-4 space-y-4 min-h-0">
                {/* Type Switcher Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5EFE6] rounded-2xl">
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
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#C4B2D8] bg-[#FAF8FC] hover:bg-[#F4EDFA] text-[#9678B6] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <Plus size={16} />
                  <span>
                    Crear Categoría de {activeTab === 'gasto' ? 'Gasto' : activeTab === 'ingreso' ? 'Ingreso' : 'Ahorro'}
                  </span>
                </button>

                {/* Categories list */}
                <div className="space-y-2.5">
                  {categories
                    .filter((c) => c.type === activeTab)
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="p-3 sm:p-3.5 rounded-2xl border border-[#EDE8DF] bg-white hover:border-[#DCD5C9] transition-all flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                          <div className="shrink-0 p-1 rounded-xl bg-[#FAF8F5] border border-[#F0EBE1] flex items-center justify-center">
                            <CategoryIcon iconOrUrl={cat.icon_or_image_url} name={cat.name} size="md" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#2D2721] truncate">
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
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:text-[#2D2721] hover:bg-[#F5EFE6] transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(cat.id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:text-[#8B2E2E] hover:bg-[#FDECE8] transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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

              {/* List View Footer */}
              <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#F0EBE1] flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#9678B6] hover:bg-[#8666A6] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW (CREATE / EDIT) */
            <form onSubmit={handleSaveCategory} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain-touch px-4 sm:px-6 py-4 space-y-4 min-h-0">
                {/* 1. Type selector */}
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
                            ? 'bg-white text-[#2D2721] shadow-2xs font-bold'
                            : 'text-[#7A7267]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Category Name & Live Preview Badge */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                      Nombre de la Categoría
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Alimentación, Sueldo, Viajes, Cafetería..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-xs font-medium text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                    />
                  </div>

                  {/* Icon/Image Live Preview Box */}
                  <div className="shrink-0 flex flex-col items-center">
                    <label className="block text-[11px] font-semibold text-[#7A7267] mb-1.5 text-center">
                      Vista previa
                    </label>
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#DDD6C8] flex items-center justify-center p-1 shadow-2xs">
                      <CategoryIcon
                        iconOrUrl={currentPreviewValue}
                        name={name || 'Vista previa'}
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Representation Mode Toggle (Emoji vs Custom Image) */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#5A5247]">
                      Personalización visual
                    </label>
                    {iconMode === 'image' && (uploadedPreview || urlInput) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] font-semibold text-[#8B2E2E] hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Quitar imagen y usar emoji</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5EFE6] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIconMode('emoji')}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        iconMode === 'emoji'
                          ? 'bg-white text-[#2D2721] shadow-2xs'
                          : 'text-[#7A7267] hover:text-[#2D2721]'
                      }`}
                    >
                      <Smile size={15} className="text-[#9678B6]" />
                      <span>Emoji o Ícono</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIconMode('image')}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        iconMode === 'image'
                          ? 'bg-white text-[#2D2721] shadow-2xs'
                          : 'text-[#7A7267] hover:text-[#2D2721]'
                      }`}
                    >
                      <ImageIcon size={15} className="text-[#9678B6]" />
                      <span>Imagen Personalizada</span>
                    </button>
                  </div>
                </div>

                {/* 4. MODE A: EMOJI PICKER DRAWER */}
                {iconMode === 'emoji' && (
                  <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE8DF] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2D2721] flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[#9678B6]" />
                        <span>Catálogo de Emojis</span>
                      </span>
                      <span className="text-[11px] text-[#7A7267]">
                        Seleccionado: <strong className="text-base ml-1">{selectedIcon}</strong>
                      </span>
                    </div>

                    {/* Mobile Phone Native Emoji Input */}
                    <div className="bg-white p-2.5 rounded-xl border border-[#DDD6C8]">
                      <label className="block text-[11px] font-semibold text-[#5A5247] mb-1 flex items-center gap-1">
                        <Smartphone size={13} className="text-[#9678B6]" />
                        <span>Usar emoji desde tu celular</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Toca aquí para abrir el teclado de emojis de tu celular..."
                        value={phoneEmojiInput}
                        onChange={(e) => handlePhoneEmojiChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#EDE8DF] focus:outline-none focus:border-[#9678B6]"
                      />
                      <p className="text-[10px] text-[#8E867B] mt-1">
                        Soporta emojis nativos, tonos de piel y banderas del sistema.
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
                          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
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
                )}

                {/* 5. MODE B: CUSTOM IMAGE DRAWER (UPLOAD OR WEB URL) */}
                {iconMode === 'image' && (
                  <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE8DF] space-y-3">
                    {/* Sub-tabs: Subir archivo vs URL */}
                    <div className="flex items-center gap-1.5 border-b border-[#EDE8DF] pb-2.5">
                      <button
                        type="button"
                        onClick={() => setImageSubTab('upload')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                          imageSubTab === 'upload'
                            ? 'bg-[#F4EDFA] text-[#9678B6]'
                            : 'text-[#7A7267] hover:text-[#2D2721]'
                        }`}
                      >
                        <Upload size={13} />
                        <span>Subir desde Celular / PC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSubTab('url')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                          imageSubTab === 'url'
                            ? 'bg-[#F4EDFA] text-[#9678B6]'
                            : 'text-[#7A7267] hover:text-[#2D2721]'
                        }`}
                      >
                        <LinkIcon size={13} />
                        <span>Pegar URL de Internet</span>
                      </button>
                    </div>

                    {/* SUBTAB 1: FILE UPLOAD */}
                    {imageSubTab === 'upload' && (
                      <div className="space-y-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-[#DDD6C8] hover:border-[#9678B6] bg-white rounded-2xl p-4 text-center cursor-pointer transition-all group"
                        >
                          {uploadedPreview && !uploadedPreview.startsWith('http') ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#EDE8DF] shadow-xs">
                                <img
                                  src={uploadedPreview}
                                  alt="Vista previa"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs font-semibold text-[#2D2721]">
                                Imagen seleccionada y optimizada
                              </span>
                              <span className="text-[11px] text-[#9678B6] font-bold group-hover:underline">
                                Toca aquí para elegir otra foto
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 py-1.5">
                              <div className="w-10 h-10 rounded-xl bg-[#F4EDFA] text-[#9678B6] flex items-center justify-center">
                                {isProcessingFile ? (
                                  <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                  <Upload size={18} />
                                )}
                              </div>
                              <span className="text-xs font-bold text-[#2D2721]">
                                {isProcessingFile
                                  ? 'Procesando y optimizando imagen...'
                                  : 'Elegir imagen de galería o archivos'}
                              </span>
                              <p className="text-[10px] text-[#8E867B] max-w-xs">
                                Compatible con fotos de celular (cámara o galería) y PC. Se ajusta automáticamente en formato cuadrado ligero.
                              </p>
                            </div>
                          )}
                        </div>

                        {fileError && (
                          <div className="p-2.5 bg-[#FDECE8] rounded-xl border border-[#F5C2BC] text-[#8B2E2E] text-xs flex items-center gap-1.5">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{fileError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 2: IMAGE URL */}
                    {imageSubTab === 'url' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5A5247] mb-1">
                            URL directa de la imagen
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://ejemplo.com/icono.png"
                              value={urlInput}
                              onChange={(e) => handleUrlChange(e.target.value)}
                              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#DDD6C8] bg-white text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                            />
                            <button
                              type="button"
                              onClick={handleTestUrl}
                              disabled={!urlInput.trim() || isValidatingUrl}
                              className="px-3.5 py-2 bg-[#9678B6] text-white text-xs font-bold rounded-xl hover:bg-[#8666A6] active:bg-[#785996] disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1"
                            >
                              {isValidatingUrl ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              <span>Validar</span>
                            </button>
                          </div>
                        </div>

                        {/* URL Status Feedback */}
                        {urlValidationStatus === 'valid' && (
                          <div className="flex items-center gap-2.5 p-2 bg-[#EBF1E6] rounded-xl border border-[#D3E1CB]">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#C4D9BA] bg-white">
                              <img
                                src={urlInput.trim()}
                                alt="Vista previa URL"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#3B4B2E] block">
                                ✓ Imagen válida y utilizable
                              </span>
                              <span className="text-[10px] text-[#556947] truncate block">
                                {urlInput.trim()}
                              </span>
                            </div>
                          </div>
                        )}

                        {urlError && (
                          <div className="p-2.5 bg-[#FDECE8] rounded-xl border border-[#F5C2BC] text-[#8B2E2E] text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>No se pudo cargar la imagen</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-[#7A2A2A]">
                              {urlError}
                            </p>
                          </div>
                        )}

                        {/* Educational note for user requirement 9 */}
                        <div className="p-2.5 bg-white rounded-xl border border-[#EDE8DF] text-[11px] text-[#7A7267] space-y-1">
                          <strong className="text-[#2D2721] block flex items-center gap-1">
                            💡 Consejo para imágenes de Google o sitios web:
                          </strong>
                          <p className="leading-relaxed">
                            Asegúrate de copiar el <strong>enlace directo al archivo</strong> (haz clic derecho o mantén pulsada la foto y elige <em>"Copiar dirección de la imagen"</em>). El enlace directo suele terminar en <code>.jpg</code>, <code>.png</code>, <code>.webp</code> o <code>.svg</code>. Copiar el enlace de la barra del navegador de Google Imágenes no funciona porque es una página de resultados y no el archivo de imagen.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Subcategories Editor */}
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
                          title="Quitar subcategoría"
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
                      placeholder="Nueva subcategoría (ej: Combustible, Restaurante...)"
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#DDD6C8] bg-white text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-3.5 py-2 bg-[#F4EDFA] hover:bg-[#E9DFF2] text-[#9678B6] font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons (fixed footer outside scroll container) */}
              <div className="p-3 sm:p-4 flex items-center justify-end gap-3 border-t border-[#F0EBE1] bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#7A7267] hover:bg-[#F5EFE6] rounded-xl transition-colors disabled:opacity-50"
                >
                  Volver al listado
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Check size={16} />
                  <span>{isSaving ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
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
        message="Se eliminará la categoría de forma permanente. Los movimientos existentes no se perderán pero ya no tendrán esta categoría asignada."
        confirmLabel={isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (deleteTargetId && !isDeleting) {
            try {
              setIsDeleting(true);
              await deleteCategory(deleteTargetId);
              setDeleteTargetId(null);
            } catch (err) {
              console.error('Error al eliminar categoría en Firestore:', err);
            } finally {
              setIsDeleting(false);
            }
          }
        }}
        onCancel={() => {
          if (!isDeleting) setDeleteTargetId(null);
        }}
      />
    </>
  );
};
