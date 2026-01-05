import ClassCategoryRow from '../../components/Settings/ClassCategoryRow'

export default function ListSettings() {
    const classCategories = {
        "Tecnologia & IA": ["Análise de Dados", "Data Science", "IA", "Visão Computacional", "Machine Learning", "Programação", "Sistemas de IA & LLMs"],
        "Engenharia & Arquitetura": ["Arquitetura", "Engenharia de Dados", "MLOps", "Artesanato de Software (Clean Code)"],
        "Conhecimento & Ciências": ["Conhecimento Geral", "Estatística", "Cosmologia & Fronteiras da Ciência"],
        "Negócios & Finanças": ["Finanças Pessoais", "Negócios", "Liberdade Econômica & Finanças"],
        "Literatura & Cultura": ["Diversidade e Inclusão", "História/Ficção", "Literatura Brasileira", "Literatura Brasileira Clássica"],
        "Desenvolvimento Pessoal": ["Bem-estar", "Comunicação", "Criatividade", "Inteligência Emocional", "Liderança", "Produtividade", "Biohacking & Existência"]
    }

    return (
        <div className="flex flex-col gap-3 animate-fade-in">
            {Object.entries(classCategories).map(([cls, cats]) => (
                <ClassCategoryRow key={cls} cls={cls} cats={cats} />
            ))}
        </div>
    )
}
