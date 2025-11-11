import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loginError, setLoginError] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoginError(''); // <-- LIMPA ERROS ANTERIORES
    setLoading(true);
  
    try {
      await login(email.trim(), password);
    } catch (error) {
      // ESTA É A MUDANÇA PRINCIPAL:
      setLoginError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/images/dietcats.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.form}>

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setLoginError('');
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLoginError('');
              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
            }}
            placeholder="Digite sua senha"
            secureTextEntry
            error={errors.password}
          />

          {/* <-- PASSO 4: Exibir a mensagem de erro aqui */}
          {loginError ? (
            <Text style={styles.formErrorText}>{loginError}</Text>
          ) : null}

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />


          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <Button
              title="Cadastrar"
              onPress={navigateToRegister}
              variant="outline"
              style={styles.registerButton}
            />
          </View>
        </View>

        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Dados para teste:</Text>
          <Text style={styles.demoText}>Paciente: paciente@teste.com / 123456</Text>
          <Text style={styles.demoText}>Nutricionista: nutricionista@teste.com / 123456</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 32,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  loginButton: {
    marginTop: 24,
  },
  
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  formErrorText: {
    fontSize: 14,
    color: '#D32F2F', // Um vermelho escuro para erros
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
});
