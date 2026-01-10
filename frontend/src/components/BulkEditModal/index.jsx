import { useState, useEffect } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  DEFAULT_CLASS_CATEGORIES,
  DEFAULT_AVAILABILITY_OPTIONS,
} from "../../utils/constants";

export default function BulkEditModal({ count, onClose, onSave }) {
  const { addToast } = useToast();
  const [updates, setUpdates] = useState({
    availability: "",
    book_class: "",
    category: "",
    priority: "",
  });
  const [classCategories, setClassCategories] = useState(
    DEFAULT_CLASS_CATEGORIES
  );
  const [availabilityOptions, setAvailabilityOptions] = useState(
    DEFAULT_AVAILABILITY_OPTIONS
  );

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/preferences/");
      if (
        res.data?.class_categories &&
        Object.keys(res.data.class_categories).length > 0
      ) {
        setClassCategories(res.data.class_categories);
      }
      if (
        res.data?.availability_options &&
        res.data.availability_options.length > 0
      ) {
        setAvailabilityOptions(res.data.availability_options);
      }
    } catch (err) {
      console.error("Erro ao carregar listas no BulkEditModal:", err);
    }
  };

  const handleChange = (e) => {
    setUpdates((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    // Filter out empty strings
    const cleanUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (updates[key]) cleanUpdates[key] = updates[key];
    });

    if (Object.keys(cleanUpdates).length === 0) {
      addToast({
        type: "warning",
        message: "Selecione pelo menos um campo para alterar.",
      });
      return;
    }

    onSave(cleanUpdates);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-neutral-800/50 p-4 border-b border-neutral-700 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
              {count}
            </span>
            Edição em Massa
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-amber-200 text-xs flex gap-2 items-start">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <p>
              Atenção: As alterações serão aplicadas a TODOS os {count} livros
              selecionados. Campos deixados em branco ("Não Alterar") serão
              mantidos como estão.
            </p>
          </div>

          {/* Class & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-bold">
                Nova Classe
              </label>
              <select
                name="book_class"
                value={updates.book_class}
                onChange={(e) =>
                  setUpdates((prev) => ({
                    ...prev,
                    book_class: e.target.value,
                    category: "",
                  }))
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
              >
                <option value="">(Não Alterar)</option>
                {Object.keys(classCategories).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-bold">
                Nova Categoria
              </label>
              <select
                name="category"
                value={updates.category}
                onChange={handleChange}
                disabled={!updates.book_class}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none disabled:opacity-50"
              >
                <option value="">(Não Alterar)</option>
                {(Array.isArray(classCategories[updates.book_class])
                  ? classCategories[updates.book_class]
                  : []
                )
                  .filter((cat) => cat !== updates.book_class)
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Availability & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-bold">
                Nova Disponibilidade
              </label>
              <select
                name="availability"
                value={updates.availability}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
              >
                <option value="">(Não Alterar)</option>
                {availabilityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-bold">
                Nova Prioridade
              </label>
              <select
                name="priority"
                value={updates.priority}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
              >
                <option value="">(Não Alterar)</option>
                <option value="1 - Baixa">1 - Baixa</option>
                <option value="2 - Média">2 - Média</option>
                <option value="3 - Média-Alta">3 - Média-Alta</option>
                <option value="4 - Alta">4 - Alta</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
          >
            <Save size={16} />
            Aplicar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
