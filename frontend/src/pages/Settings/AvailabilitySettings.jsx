import { useState, useEffect } from "react";
import { Plus, Trash2, X, RotateCcw, Save, Check, Layers } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const DEFAULT_AVAILABILITY_OPTIONS = [
  "Físico",
  "Virtual",
  "Desejado",
  "Emprestado",
  "N/A",
];

export default function AvailabilitySettings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityOptions, setAvailabilityOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/preferences/");
      if (
        res.data?.availability_options &&
        res.data.availability_options.length > 0
      ) {
        setAvailabilityOptions(res.data.availability_options);
      } else {
        setAvailabilityOptions(DEFAULT_AVAILABILITY_OPTIONS);
      }
    } catch (err) {
      console.error("Erro ao carregar disponibilidade:", err);
      setAvailabilityOptions(DEFAULT_AVAILABILITY_OPTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.get("/preferences/");
      await api.put("/preferences/", {
        ...res.data,
        availability_options: availabilityOptions,
      });
      addToast({ type: "success", message: "Opções salvas com sucesso!" });
    } catch (err) {
      addToast({ type: "error", message: "Erro ao salvar opções." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm("Isso restaurará o padrão de opções. Deseja continuar?")
    ) {
      setAvailabilityOptions(DEFAULT_AVAILABILITY_OPTIONS);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando opções...
      </div>
    );

  return (
    <div className="w-full animate-fade-in space-y-6 pb-20">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Disponibilidade
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Personalize as opções de status físico/virtual dos seus livros.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden p-6 shadow-sm">
        <AvailabilityManager
          options={availabilityOptions}
          setOptions={setAvailabilityOptions}
        />
      </div>

      {/* Sticky Actions */}
      <div className="flex justify-between items-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 sticky bottom-6 shadow-2xl">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
        >
          <RotateCcw size={18} />
          Restaurar Padrões
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Salvando..." : "Salvar Opções"}
        </button>
      </div>
    </div>
  );
}

function AvailabilityManager({ options, setOptions }) {
  const [newOption, setNewOption] = useState("");
  const { addToast } = useToast();

  const handleAdd = () => {
    if (!newOption.trim()) return;
    const val = newOption.trim();
    if (options && options.includes(val)) {
      addToast({ type: "error", message: "Opção já existe." });
      return;
    }

    const current = options || [];
    setOptions([...current, val]);
    setNewOption("");
  };

  const handleRemove = (opt) => {
    if (window.confirm(`Remover opção "${opt}"?`)) {
      setOptions(options.filter((o) => o !== opt));
    }
  };

  const safeOptions = options || [];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {safeOptions.map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-neutral-700 animate-scale-in group transition-all hover:bg-slate-200 dark:hover:bg-neutral-700"
          >
            {opt}
            <button
              onClick={() => handleRemove(opt)}
              className="p-1 rounded-full hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 w-full max-w-sm">
        <input
          placeholder="Nova opção (ex: Audiobook)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-5 py-2.5 bg-slate-900 dark:bg-neutral-700 hover:bg-slate-800 dark:hover:bg-neutral-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
