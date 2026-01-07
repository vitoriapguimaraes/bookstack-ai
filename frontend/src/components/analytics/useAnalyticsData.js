import { useMemo } from 'react'
import { getClassBaseHSL, hslToString } from './analyticsUtils'

export function useAnalyticsData(books) {
    return useMemo(() => {
        if (!books || books.length === 0) return null

        const lidos = books.filter(b => b.status === 'Lido')
        const naoLidos = books.filter(b => b.status === 'A Ler' || b.status === 'Lendo')

        // 1. KPIs
        const total = books.length
        const reading = books.filter(b => b.status === 'Lendo').length

        const avgRating = lidos.length > 0
            ? (lidos.reduce((acc, b) => acc + (b.rating || 0), 0) / lidos.filter(b => b.rating).length)
            : 0

        // Average Index (Score)
        const booksWithScore = books.filter(b => b.score != null)
        const avgScore = booksWithScore.length > 0
            ? (booksWithScore.reduce((acc, b) => acc + (b.score || 0), 0) / booksWithScore.length)
            : 0

        // 2. Timeline Data (only Lidos)
        const allClasses = new Set()
        const allCategories = new Set()

        // Fallback Map for Categories often found without a class in DB
        const FALLBACK_CATEGORY_MAP = {
            'comunicação': 'Desenvolvimento Pessoal',
            'bem-estar': 'Desenvolvimento Pessoal',
            'diversidade e inclusão': 'Literatura & Cultura',
            'machine learning': 'Tecnologia & IA',
            // Common variations
            'análise de dados': 'Tecnologia & IA',
            'data science': 'Tecnologia & IA',
            'ia': 'Tecnologia & IA',
            'visão computacional': 'Tecnologia & IA',
            'programação': 'Tecnologia & IA',
            'sistemas de ia & llms': 'Tecnologia & IA',
            'arquitetura de software': 'Engenharia & Arquitetura',
            'engenharia de dados': 'Engenharia & Arquitetura',
            'mlops': 'Engenharia & Arquitetura',
            'conhecimento geral': 'Conhecimento & Ciências',
            'estatística': 'Conhecimento & Ciências',
            'cosmologia': 'Conhecimento & Ciências',
            'finanças pessoais': 'Negócios & Finanças',
            'negócios': 'Negócios & Finanças',
            'liberdade econômica': 'Negócios & Finanças',
            'história/ficção': 'Literatura & Cultura',
            'literatura brasileira': 'Literatura & Cultura',
            'literatura brasileira clássica': 'Literatura & Cultura',
            'criatividade': 'Desenvolvimento Pessoal',
            'inteligência emocional': 'Desenvolvimento Pessoal',
            'liderança': 'Desenvolvimento Pessoal',
            'produtividade': 'Desenvolvimento Pessoal',
            'biohacking & existência': 'Desenvolvimento Pessoal'
        }

        const normalize = (s) => s ? s.toLowerCase().trim() : ''

        const aggregateTimeline = (granularity) => {
            if (lidos.length === 0) return []

            const validDates = lidos
                .map(b => b.date_read ? new Date(b.date_read) : null)
                .filter(d => d && !isNaN(d.getTime()))

            if (validDates.length === 0) return []

            const minDate = new Date(Math.min(...validDates))
            const maxDate = new Date(Math.max(...validDates))

            const map = {}

            // Pre-fill keys
            let current = new Date(minDate)
            // Reset to start of period
            if (granularity === 'month') current.setDate(1)
            else current.setMonth(0, 1)

            while (current <= maxDate) {
                let key = ''
                if (granularity === 'month') {
                    key = current.toISOString().slice(0, 7) // YYYY-MM
                    current.setMonth(current.getMonth() + 1)
                } else {
                    key = current.getFullYear().toString()
                    current.setFullYear(current.getFullYear() + 1)
                }

                map[key] = {
                    date: key,
                    total: 0,
                    Tecnico: 0, NaoTecnico: 0,
                    classes: {},
                    categories: {}
                }
            }

            lidos.forEach(book => {
                if (!book.date_read) return
                const date = new Date(book.date_read)
                if (isNaN(date.getTime())) return

                let key = ''
                if (granularity === 'month') key = date.toISOString().slice(0, 7)
                else key = date.getFullYear().toString()

                if (!map[key]) {
                    map[key] = {
                        date: key,
                        total: 0,
                        Tecnico: 0, NaoTecnico: 0,
                        classes: {},
                        categories: {}
                    }
                }

                const entry = map[key]
                entry.total += 1
                if (book.type === 'Técnico') entry.Tecnico += 1
                else entry.NaoTecnico += 1

                const cls = book.book_class
                if (cls) {
                    allClasses.add(cls)
                    entry.classes[cls] = (entry.classes[cls] || 0) + 1
                }

                const cat = book.category
                if (cat) {
                    allCategories.add(cat)
                    entry.categories[cat] = (entry.categories[cat] || 0) + 1
                }
            })

            const sortedData = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))

            return sortedData.map(item => {
                const flatItem = {
                    date: item.date,
                    total: item.total,
                    'Técnico': item.Tecnico,
                    'Não Técnico': item.NaoTecnico,
                    ...item.classes,
                    ...item.categories
                }
                return flatItem
            })
        }

        const timelineMonthly = aggregateTimeline('month')
        const timelineYearly = aggregateTimeline('year')

        // 3. Historical Insights
        // A. Start & End of Journey
        const validDates = lidos.filter(b => b.date_read && !isNaN(new Date(b.date_read).getTime()))
        const sortedDates = validDates.sort((a, b) => new Date(a.date_read) - new Date(b.date_read))

        const oldestRead = sortedDates[0]
        const newestRead = sortedDates[sortedDates.length - 1]

        // B. Top Author
        const authorMap = {}
        lidos.forEach(b => {
            if (b.author) authorMap[b.author] = (authorMap[b.author] || 0) + 1
        })

        let topAuthorsList = []
        let maxAuthorCount = 0

        Object.entries(authorMap).forEach(([author, count]) => {
            if (count > maxAuthorCount) {
                maxAuthorCount = count
                topAuthorsList = [author]
            } else if (count === maxAuthorCount) {
                topAuthorsList.push(author)
            }
        })

        const topAuthor = maxAuthorCount > 0 ? { names: topAuthorsList, count: maxAuthorCount } : null

        // C. Busiest Year
        const yearMap = {}
        lidos.forEach(b => {
            if (!b.date_read) return
            const year = new Date(b.date_read).getFullYear()
            if (!isNaN(year)) yearMap[year] = (yearMap[year] || 0) + 1
        })

        let busiestYearsList = []
        let maxCount = 0

        Object.entries(yearMap).forEach(([year, count]) => {
            if (count > maxCount) {
                maxCount = count
                busiestYearsList = [year]
            } else if (count === maxCount) {
                busiestYearsList.push(year)
            }
        })
        busiestYearsList.sort((a, b) => a - b)

        const busiestYear = maxCount > 0 ? { years: busiestYearsList, count: maxCount } : null

        // 4. Distributions
        const getDistribution = (list, field) => {
            const map = {}
            list.forEach(b => {
                const val = b[field] || 'Não definido'
                map[val] = (map[val] || 0) + 1
            })
            return Object.entries(map)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
        }

        // Map Categories to Classes for color grouping
        const categoryToClass = {}
        books.forEach(b => {
             // Populate allCategories set with EVERY category found (read or unread)
             if (b.category) {
                 allCategories.add(b.category)
             }

             // 1. Try from book data
             if (b.category && b.book_class) {
                 categoryToClass[b.category] = b.book_class
             } 
             // 2. Fallback if class is missing but we know the category
             else if (b.category) {
                 const normCat = normalize(b.category)
                 if (FALLBACK_CATEGORY_MAP[normCat]) {
                     categoryToClass[b.category] = FALLBACK_CATEGORY_MAP[normCat]
                 }
             }
        })
        
        // Identify "Orphan" Categories (those without a valid class AND no fallback)
        const unmappedCategories = new Set()
        books.forEach(b => {
            if (b.category && !categoryToClass[b.category]) {
                unmappedCategories.add(b.category)
            }
        })

        const dist = {
            lidos: {
                type: getDistribution(lidos, 'type'),
                class: getDistribution(lidos, 'book_class'),
                category: getDistribution(lidos, 'category')
            },
            naoLidos: {
                type: getDistribution(naoLidos, 'type'),
                class: getDistribution(naoLidos, 'book_class'),
                category: getDistribution(naoLidos, 'category')
            }
        }

        // Generate consistent colors for categories based on their class
        const categoryColors = {}
        const catsByClass = {}

        // Collect all categories from both Lidos and Nao Lidos (or use the Set we created earlier)
        Array.from(allCategories).forEach(catName => {
             const cls = categoryToClass[catName] || 'Outros'
             if (!catsByClass[cls]) catsByClass[cls] = []
             catsByClass[cls].push(catName)
        })

        // Generate colors
        Object.keys(catsByClass).forEach(cls => {
            const cats = catsByClass[cls]
            const baseHSL = getClassBaseHSL(cls)
            cats.forEach((catName, idx) => {
                const lightnessStep = 5 
                const offset = (idx - (cats.length - 1) / 2) * lightnessStep
                const newL = Math.max(20, Math.min(90, baseHSL.l + offset))
                categoryColors[catName] = hslToString({ ...baseHSL, l: newL })
            })
        })

        return {
            kpi: { total, lidos: lidos.length, aLer: naoLidos.length, reading, avgRating, avgScore },
            insights: { oldestRead, newestRead, topAuthor, busiestYear },
            timeline: { monthly: timelineMonthly, yearly: timelineYearly },
            timelineMeta: { classes: Array.from(allClasses), categories: Array.from(allCategories) },
            meta: { categoryToClass, categoryColors, unmappedCategories: Array.from(unmappedCategories) },
            dist
        }
    }, [books])
}
