import { useState, useEffect } from "react";
import {
  Upload,
  Save,
  X,
  Sparkles,
  Download,
  BookOpen,
  Layers,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import {
  DEFAULT_CLASS_CATEGORIES,
  DEFAULT_AVAILABILITY_OPTIONS,
} from "../../utils/constants";

export default function BookForm({
  bookToEdit,
  onSuccess,
  onCancel,
  onLoadingChange,
}) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    original_title: "",
    author: "",
    status: "A Ler",
    book_class: "Desenvolvimento Pessoal",
    category: "Geral",
    priority: "2 - Média",
    availability: "Físico",
    type: "Não Técnico",
    year: new Date().getFullYear(),
    rating: 0,
    order: null,
    google_rating: null,
    motivation: "",
    cover_image: null,
    date_read: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedCoverUrl, setSuggestedCoverUrl] = useState(null);
  const [googleRating, setGoogleRating] = useState(null);
  const [classCategories, setClassCategories] = useState(
    DEFAULT_CLASS_CATEGORIES
  );
  const [availabilityOptions, setAvailabilityOptions] = useState(
    DEFAULT_AVAILABILITY_OPTIONS
  );

  useEffect(() => {
    fetchPreferences();
    if (bookToEdit) {
      setFormData({
        ...bookToEdit,
        cover_image: bookToEdit.cover_image,
        date_read: bookToEdit.date_read || "",
        order: bookToEdit.order || null,
        rating: bookToEdit.rating || 0,
      });
    }
  }, [bookToEdit]);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/preferences/");
      if (res.data) {
        if (
          res.data.class_categories &&
          Object.keys(res.data.class_categories).length > 0
        ) {
          setClassCategories(res.data.class_categories);
        }

        if (
          res.data.availability_options &&
          res.data.availability_options.length > 0
        ) {
          setAvailabilityOptions(res.data.availability_options);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar listas no BookForm:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      if (name === "status") {
        if (value === "Lido") {
          newData.priority = "Concluído";
        } else if (value === "Lendo" && prev.status !== "Lendo") {
          // We need to fetch books to calculate order, but we can't await here.
          // We'll set a placeholder or fire an effect, but simplest is to fire promise side-effect
          api
            .get("/books/")
            .then((res) => {
              const allBooks = res.data;
              const readingBooks = allBooks.filter((b) => b.status === "Lendo");
              const maxOrder = readingBooks.reduce(
                (max, b) => (b.order > max ? b.order : max),
                0
              );

              setFormData((curr) => ({
                ...curr,
                order: maxOrder + 1,
              }));
            })
            .catch((err) =>
              console.error("Error auto-calculating order:", err)
            );
        } else if (prev.status === "Lido") {
          if (prev.priority === "Concluído") {
            newData.priority = "1 - Baixa";
          }
        }
      }

      return newData;
    });
  };

  const handleClassChange = (e) => {
    const newClass = e.target.value;
    const firstCategory =
      (classCategories[newClass] && classCategories[newClass][0]) || "";
    setFormData((prev) => ({
      ...prev,
      book_class: newClass,
      category: firstCategory,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);

      // Create local preview immediately
      setFormData((prev) => ({
        ...prev,
        cover_image: URL.createObjectURL(file),
      }));
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.title) {
      addToast({ type: "warning", message: "Digite um título primeiro!" });
      return;
    }

    setAiLoading(true);
    setSuggestedCoverUrl(null);
    try {
      const res = await api.post("/books/suggest", {
        title: formData.title,
      });
      const suggestion = res.data;

      if (suggestion) {
        // Check for explicit error from backend
        if (suggestion.error) {
          console.error("AI Error Log:", suggestion.error);
          addToast({
            type: "error",
            message: `Falha na IA: ${suggestion.error}`,
          });
          return;
        }

        setFormData((prev) => ({
          ...prev,
          author: suggestion.author || prev.author,
          year: suggestion.year || prev.year,
          book_class: suggestion.book_class || prev.book_class,
          type: suggestion.type || prev.type,
          category: suggestion.category || prev.category,
          motivation: suggestion.motivation || prev.motivation,
          original_title: suggestion.original_title || prev.original_title,
          google_rating: suggestion.google_rating || null,
          cover_image: suggestion.cover_url || prev.cover_image,
        }));

        if (!suggestion.motivation) {
          addToast({
            type: "warning",
            message: "A IA não preencheu tudo. Verifique os campos.",
          });
        }

        if (suggestion.cover_url) {
          setSuggestedCoverUrl(null);
        }

        // Armazena nota do Google Books
        if (suggestion.google_rating) {
          setGoogleRating({
            rating: suggestion.google_rating,
            count: suggestion.google_ratings_count || 0,
          });
        }
      }
    } catch (err) {
      console.error(err);
      addToast({
        type: "error",
        message: "Erro de conexão com o servidor.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseSuggestedCover = () => {
    if (suggestedCoverUrl) {
      setFormData((prev) => ({ ...prev, cover_image: suggestedCoverUrl }));
      setSuggestedCoverUrl(null);
      addToast({
        type: "success",
        message: "Capa da IA aplicada!",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.title.trim()) {
      addToast({ type: "error", message: "O Título é obrigatório!" });
      return;
    }
    if (!formData.author || !formData.author.trim()) {
      addToast({ type: "error", message: "O Autor é obrigatório!" });
      return;
    }
    if (formData.status === "Lido" && !formData.date_read) {
      addToast({ type: "error", message: "Data de leitura obrigatória!" });
      return;
    }

    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      // Ensure numeric types
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        // rating: formData.rating ? parseInt(formData.rating) : 0, // rating kept as is
        order: formData.order ? parseInt(formData.order) : null,
      };

      let savedBook;
      if (bookToEdit) {
        const res = await api.put(`/books/${bookToEdit.id}`, payload);
        savedBook = res.data;
      } else {
        const res = await api.post("/books/", payload);
        savedBook = res.data;
      }

      // Only upload file if user selected a local file
      if (coverFile && savedBook.id) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", coverFile);

        await api.post(`/books/${savedBook.id}/cover`, formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      addToast({ type: "success", message: "Livro salvo com sucesso!" });
      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar livro:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        addToast({
          type: "error",
          message:
            err.response.status === 405
              ? "Erro 405: Rota incorreta."
              : `Erro: ${err.response.data?.detail || "Ao salvar livro"}`,
        });
      } else {
        addToast({ type: "error", message: "Erro de conexão ao salvar." });
      }
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <form
      id="book-form-main"
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-slate-200 dark:border-neutral-800 w-full animate-fade-in text-slate-900 dark:text-white"
    >
      {/* Actions moved to parent header */}

      <div className="p-3 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT COLUMN: BOOK DATA (AI & METADATA) - 7 cols */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} /> Dados da Obra
            </h3>
            {/* AI Button Contextual */}
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={aiLoading || !formData.title}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/50 to-purple-800/50 hover:from-purple-800 hover:to-purple-700 text-purple-200 border border-purple-500/30 px-2 py-1 rounded text-[10px] transition-all disabled:opacity-50"
              title="Preencher restante do formulário com IA"
            >
              <Sparkles size={12} />{" "}
              {aiLoading ? "Buscando..." : "Auto-Completar"}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-neutral-800/50 space-y-3">
            {/* Title & Original Title */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                  Título Principal
                </label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-bold placeholder-slate-400 dark:placeholder-neutral-700"
                  placeholder="Ex: Hábitos Atômicos"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Título Original
                  </label>
                  <input
                    name="original_title"
                    value={formData.original_title || ""}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs p-2 focus:border-purple-500 italic placeholder-slate-400 dark:placeholder-neutral-700"
                    placeholder="..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Autor
                  </label>
                  <input
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500 placeholder-slate-400 dark:placeholder-neutral-700"
                  />
                </div>
              </div>
            </div>

            {/* Visual & Core Meta */}
            <div className="flex gap-3">
              {/* Cover */}
              <div className="w-20 flex-shrink-0 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider text-center">
                  Capa
                </label>
                <div className="w-20 h-28 bg-slate-100 dark:bg-neutral-900 rounded border border-slate-200 dark:border-neutral-700 overflow-hidden relative group shadow-sm dark:shadow-lg">
                  {formData.cover_image ? (
                    <img
                      src={formData.cover_image}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-neutral-700 gap-1">
                      <Upload size={16} />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="w-full bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-[9px] py-1 rounded text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-300 dark:border-neutral-700"
                  >
                    Upload
                  </button>
                </div>
                {suggestedCoverUrl && (
                  <button
                    type="button"
                    onClick={handleUseSuggestedCover}
                    className="w-full flex items-center justify-center gap-1 px-1 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 rounded text-[9px] hover:bg-emerald-900/60 transition-colors"
                  >
                    <Download size={8} /> Usar IA
                  </button>
                )}
              </div>

              {/* Classification Grid */}
              <div className="flex-1 grid grid-cols-2 gap-3 content-start">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Tipo
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
                  >
                    <option>Não Técnico</option>
                    <option>Técnico</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Classe Macro
                  </label>
                  <select
                    name="book_class"
                    value={formData.book_class}
                    onChange={handleClassChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
                  >
                    {Object.keys(classCategories).map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Categoria Específica
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
                  >
                    {(classCategories[formData.book_class] || [])
                      .filter((cat) => cat !== formData.book_class)
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                Resumo / Motivação
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                rows={2}
                className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs p-2 focus:border-purple-500 placeholder-slate-400 dark:placeholder-neutral-700 resize-none"
                placeholder="Sobre o que é este livro?"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: USER MANAGEMENT (STATUS & CONTROL) - 5 cols */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} /> Meu Gerenciamento
          </h3>

          <div className="bg-slate-50 dark:bg-neutral-800/30 p-4 rounded-lg border border-slate-200 dark:border-neutral-700/50 flex flex-col gap-4 flex-1">
            {/* Status Highlight */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-white mb-1.5 uppercase">
                Status Atual
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {["A Ler", "Lendo", "Lido"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      // Trigger same logic as handleChange manually or just simulate event
                      handleChange({ target: { name: "status", value: s } });
                    }}
                    className={`py-1.5 rounded text-xs font-bold border transition-all ${
                      formData.status === s
                        ? s === "Lido"
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : s === "Lendo"
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-slate-300 dark:bg-neutral-600 border-slate-400 dark:border-neutral-500 text-slate-800 dark:text-white"
                        : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-400 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-700/50"></div>

            {/* Availability - Always Visible */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                Disponível em
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
              >
                {/* Dynamically render options */}
                {availabilityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* CONDITIONAL FIELDS BASED ON STATUS */}
            {formData.status === "Lido" ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-emerald-900/10 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-900/30 dark:border-emerald-500/30 text-center">
                  <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
                    Sua Avaliação
                  </label>
                  <div className="flex justify-center gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, rating: star }))
                        }
                        className={`text-xl transition-transform hover:scale-110 ${
                          (formData.rating || 0) >= star
                            ? "text-amber-400"
                            : "text-slate-300 dark:text-neutral-700"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                    {formData.rating
                      ? `${formData.rating}/5 Estrelas`
                      : "Sem nota"}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Data de Conclusão
                  </label>
                  <input
                    type="text"
                    name="date_read"
                    value={formData.date_read || ""}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-emerald-500 text-center"
                    placeholder="YYYY/MM"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Prioridade de Leitura
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-xs p-2 focus:border-purple-500"
                  >
                    <option>1 - Baixa</option>
                    <option>2 - Média</option>
                    <option>3 - Média-Alta</option>
                    <option>4 - Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
                    Ordem na Fila
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-neutral-500 text-sm">
                      #
                    </span>
                    <input
                      type="number"
                      name="order"
                      value={formData.order || ""}
                      onChange={handleChange}
                      className="w-full rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-sm p-1.5 font-bold focus:border-purple-500"
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>
            )}

            {googleRating && (
              <div className="mt-2 pt-2 border-t border-neutral-700/50 text-center">
                <p className="text-[9px] uppercase text-neutral-500 mb-0.5">
                  Referência Externa
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-900/20 border border-amber-900/40 rounded-full text-amber-500 text-[10px]">
                  <span>
                    Google Books: <b>{googleRating.rating}</b>
                  </span>
                  <span className="opacity-50">({googleRating.count})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
