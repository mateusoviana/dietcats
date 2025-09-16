import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { UserType } from '../../types';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('patient');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

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

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        userType,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const toggleUserType = () => {
    setUserType(userType === 'patient' ? 'nutritionist' : 'patient');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Preencha os dados abaixo</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            error={errors.name}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Digite sua senha novamente"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>Tipo de usuário:</Text>
            <View style={styles.userTypeButtons}>
              <Button
                title="Paciente"
                onPress={toggleUserType}
                variant={userType === 'patient' ? 'primary' : 'outline'}
                style={styles.userTypeButton}
              />
              <Button
                title="Nutricionista"
                onPress={toggleUserType}
                variant={userType === 'nutritionist' ? 'primary' : 'outline'}
                style={styles.userTypeButton}
              />
            </View>
          </View>

          <Button
            title="Criar Conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <Button
              title="Fazer login"
              onPress={navigateToLogin}
              variant="outline"
              style={styles.loginButton}
            />
          </View>
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
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  userTypeContainer: {
    marginVertical: 16,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  registerButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
});
