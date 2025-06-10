// /app/admin/register/page.tsx

// ... (mantenha todos os seus imports existentes)
import { supabase } from '@/lib/supabase-client'; // Verifique se o caminho está correto!

// ... (mantenha a definição do seu schema com Zod)

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const router = useRouter();

  // ***** INÍCIO DA SEÇÃO PARA EDITAR *****

  async function handleRegister(data: RegisterSchema) {
    try {
      // Passo 1: Realizar o cadastro no sistema de autenticação do Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Opcional: passa o nome do usuário para ser usado no template de e-mail
          data: {
            full_name: data.name,
          }
        }
      });

      if (signUpError) {
        // Se o erro for que o usuário já existe, podemos dar uma mensagem amigável
        if (signUpError.message.includes("User already registered")) {
            alert("Este email já está cadastrado. Tente fazer login.");
            router.push('/admin/login');
            return;
        }
        // Para outros erros de cadastro, jogue o erro para o bloco catch
        throw signUpError;
      }
      
      // Se o signUp não retornou um usuário, algo muito errado aconteceu
      if (!authData.user) {
        throw new Error("Cadastro falhou! O usuário não foi criado.");
      }

      // Passo 2: Inserir os dados na tabela 'profiles'
      // O papel ('role') será 'admin' para todos que se registrarem por esta página.
      // Isso está de acordo com a lógica de "setup" inicial.
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,    // Usa o ID do usuário recém-criado
          full_name: data.name,
          role: 'admin',           // Define o papel como admin
        });
        
      if (profileError) {
        // Se houver um erro ao criar o perfil, jogue o erro
        // O Supabase Auth tem um usuário órfão agora, mas é um caso raro.
        throw profileError;
      }

      // Passo 3: Sucesso! Informar o usuário e redirecionar.
      alert('Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar a conta antes de fazer login.');
      router.push('/admin/login');

    } catch (error: any) {
      console.error('Erro no processo de registro:', error);
      alert(`Ocorreu um erro: ${error.message}`);
    }
  }

  // ***** FIM DA SEÇÃO PARA EDITAR *****


  // O restante do seu componente (o JSX do formulário) permanece exatamente o mesmo.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      {/* ... seu JSX continua aqui ... */}
       <form onSubmit={handleSubmit(handleRegister)}>
         {/* ... seus inputs e botão ... */}
       </form>
    </div>
  );
}
