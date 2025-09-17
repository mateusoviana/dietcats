import { User, RegisterData } from '../types';

class AuthService {
  // Simulação de dados para desenvolvimento
  private users: User[] = [
    {
      id: '1',
      email: 'paciente@teste.com',
      name: 'João Silva',
      userType: 'patient',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'nutricionista@teste.com',
      name: 'Dra. Maria Santos',
      userType: 'nutritionist',
      createdAt: new Date().toISOString(),
    },
  ];

  async login(email: string, password: string): Promise<User> {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Em uma aplicação real, a senha seria verificada no servidor
    if (password !== '123456') {
      throw new Error('Senha incorreta');
    }

    return user;
  }

  async register(userData: RegisterData): Promise<User> {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    return newUser;
  }
}

export const authService = new AuthService();
