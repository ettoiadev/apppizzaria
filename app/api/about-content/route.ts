import { NextResponse } from "next/server"

// Mock about content - In production, this would come from a database
const mockAboutContent = {
  hero: {
    title: "Nossa História",
    subtitle: "Tradição e Sabor desde 2010",
    description:
      "Somos uma pizzaria familiar que nasceu do sonho de compartilhar o verdadeiro sabor da pizza italiana com nossa comunidade.",
    image: "/placeholder.svg?height=600&width=800",
  },
  story: {
    title: "Como Tudo Começou",
    paragraphs: [
      "Em 2010, com muito amor pela culinária italiana e o sonho de criar algo especial, nasceu a Pizza Express. Começamos como uma pequena pizzaria familiar no coração de São Paulo, com apenas algumas mesas e um forno a lenha tradicional.",
      "Nossa receita secreta não está apenas na massa artesanal ou nos ingredientes frescos selecionados diariamente. Está no carinho e dedicação que colocamos em cada pizza, tratando cada cliente como parte da nossa família.",
      "Ao longo dos anos, crescemos e evoluímos, mas nunca perdemos nossa essência: fazer a melhor pizza da cidade com ingredientes de qualidade e muito amor. Hoje, atendemos toda a região com nosso serviço de delivery, levando o sabor autêntico da Pizza Express até você.",
    ],
    image: "/placeholder.svg?height=500&width=600",
  },
  values: {
    title: "Nossos Valores",
    subtitle: "Os princípios que nos guiam todos os dias",
    values: [
      {
        icon: "heart",
        title: "Paixão pela Qualidade",
        description:
          "Cada pizza é feita com ingredientes selecionados e muito carinho, garantindo sempre o melhor sabor.",
      },
      {
        icon: "star",
        title: "Excelência no Atendimento",
        description: "Tratamos cada cliente como família, oferecendo um atendimento personalizado e acolhedor.",
      },
      {
        icon: "users",
        title: "Compromisso com a Comunidade",
        description: "Somos parte da comunidade e nos orgulhamos de contribuir para o bem-estar local.",
      },
      {
        icon: "leaf",
        title: "Sustentabilidade",
        description: "Nos preocupamos com o meio ambiente, usando embalagens eco-friendly e ingredientes locais.",
      },
    ],
  },
  team: {
    title: "Nossa Equipe",
    subtitle: "As pessoas que fazem a magia acontecer",
    members: [
      {
        name: "Marco Rossi",
        role: "Chef Pizzaiolo",
        description:
          "Com mais de 15 anos de experiência, Marco é o responsável por manter a tradição e qualidade de nossas pizzas.",
        image: "/placeholder.svg?height=300&width=300",
      },
      {
        name: "Ana Silva",
        role: "Gerente Geral",
        description: "Ana cuida de toda a operação, garantindo que cada cliente tenha a melhor experiência possível.",
        image: "/placeholder.svg?height=300&width=300",
      },
      {
        name: "Carlos Santos",
        role: "Coordenador de Delivery",
        description:
          "Carlos lidera nossa equipe de entrega, assegurando que sua pizza chegue quentinha e no tempo certo.",
        image: "/placeholder.svg?height=300&width=300",
      },
    ],
  },
  contact: {
    title: "Venha nos Visitar",
    subtitle: "Estamos sempre prontos para recebê-lo",
    address: "Rua das Pizzas, 123 - Centro, São Paulo/SP",
    phone: "(11) 99999-9999",
    email: "contato@pizzaexpress.com",
    hours: "Seg-Dom: 18h às 23h",
  },
}

export async function GET() {
  try {
    return NextResponse.json(mockAboutContent)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar conteúdo" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updatedContent = await request.json()

    // In production, save to database
    console.log("Updating about content:", updatedContent)

    return NextResponse.json({ success: true, data: updatedContent })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar conteúdo" }, { status: 500 })
  }
}
