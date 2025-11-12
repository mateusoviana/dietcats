import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { accountService } from '../../services/AccountService';
import { associationService } from '../../services/AssociationService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ProfileScreen() {
   const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [associationCode, setAssociationCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nutritionist, setNutritionist] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isAssociating, setIsAssociating] = useState(false);
  
  // --- 1. Adicionar estado para os erros de validação ---
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load nutritionist on mount
  useEffect(() => {
    loadNutritionist();
  }, []);

  const loadNutritionist = async () => {
    console.log('🔄 [ProfileScreen] loadNutritionist called');
    try {
      console.log('🔄 [ProfileScreen] Calling associationService.getMyNutritionist...');
      const data = await associationService.getMyNutritionist();
      console.log('🔄 [ProfileScreen] Nutritionist data received:', data);
      setNutritionist(data);
      console.log('✅ [ProfileScreen] Nutritionist state updated');
    } catch (error) {
      console.error('❌ [ProfileScreen] Error loading nutritionist:', error);
      console.error('❌ [ProfileScreen] Error details:', JSON.stringify(error, null, 2));
    }
  };

  // --- 2. Criar função de validação ---
  const validateProfile = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório'; // <-- Sua mensagem!
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'O formato do email é inválido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 3. Atualizar o handleSave ---
  const handleSave = async () => {
    if (isSaving) return;

    // Usar a nova função de validação
    if (!validateProfile()) {
      return; // Para a execução se a validação falhar
    }
    
    // Se nada mudou, apenas saia do modo de edição
    if (name === user?.name && email === user?.email) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name, email });
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!'); // Sucesso ainda usa Alert
      setIsEditing(false);
      setErrors({}); // Limpa erros após o sucesso
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', (error as Error).message || 'Não foi possível atualizar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setErrors({}); // Limpar erros ao cancelar
  };

  const handleLogout = () => {
    console.log('handleLogout chamado');
    
    // On web, use window.confirm as fallback
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja sair da sua conta?');
      if (confirmed) {
        console.log('Confirmando logout...');
        logout().catch(error => {
          console.error('Erro ao fazer logout:', error);
        });
      } else {
        console.log('Logout cancelado');
      }
      return;
    }
    
    // On native, use Alert
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => console.log('Logout cancelado')
        },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => {
            console.log('Confirmando logout...');
            try {
              await logout();
              console.log('Logout executado com sucesso');
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é permanente e excluirá seus dados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountService.deleteAccount();
              Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
              await logout();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir a conta.');
            }
          },
        },
      ]
    );
  };

  const handleAssociateNutritionist = async () => {
    console.log('🟢 [ProfileScreen] handleAssociateNutritionist called');
    console.log('🟢 [ProfileScreen] associationCode:', associationCode);
    
    if (!associationCode.trim()) {
      console.log('❌ [ProfileScreen] Code is empty');
      Alert.alert('Erro', 'Digite o código de associação');
      return;
    }

    console.log('🟢 [ProfileScreen] Setting isAssociating to true');
    setIsAssociating(true);
    
    try {
      console.log('🟢 [ProfileScreen] Calling associationService.associateWithCode...');
      const result = await associationService.associateWithCode(associationCode);
      console.log('🟢 [ProfileScreen] Result received:', result);
      
      if (result.success) {
        console.log('✅ [ProfileScreen] Association successful!');
        Alert.alert(
          'Sucesso!',
          `Você foi associado com ${result.nutritionistName}`,
          [{ text: 'OK', onPress: () => {
            console.log('🟢 [ProfileScreen] OK pressed, clearing code and reloading...');
            setAssociationCode('');
            loadNutritionist(); // Reload nutritionist data
          }}]
        );
      } else {
        console.log('❌ [ProfileScreen] Association failed:', result.error);
        Alert.alert('Erro', result.error || 'Código inválido');
      }
    } catch (error) {
      console.error('💥 [ProfileScreen] Exception in handleAssociateNutritionist:', error);
      console.error('💥 [ProfileScreen] Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Erro', 'Não foi possível associar com o nutricionista');
    } finally {
      console.log('🟢 [ProfileScreen] Setting isAssociating to false');
      setIsAssociating(false);
    }
  };

  const handleRemoveAssociation = () => {
    Alert.alert(
      'Remover Associação',
      `Deseja remover a associação com ${nutritionist?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await associationService.removeAssociation();
              setNutritionist(null);
              Alert.alert('Sucesso', 'Associação removida');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover a associação');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: 'notifications-outline',
      title: 'Notificações',
      subtitle: 'Gerenciar lembretes e alertas',
      onPress: () => {},
    },
    {
      icon: 'time-outline',
      title: 'Horários de Refeição',
      subtitle: 'Configurar seus horários',
      onPress: () => {},
    },
    {
      icon: 'people-outline',
      title: 'Meu Nutricionista',
      subtitle: 'Informações do profissional',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Ajuda e Suporte',
      subtitle: 'Central de ajuda',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      title: 'Sobre o App',
      subtitle: 'Versão 1.0.0',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Gerencie suas informações</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#4CAF50" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <>
                {/* --- 4. Conectar os Inputs --- */}
                <Input
                  label="Nome"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Digite seu nome"
                  error={errors.name}
                />
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="Digite seu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                <View style={styles.editButtons}>
                  <Button
                    title="Salvar"
                    onPress={handleSave}
                    style={styles.saveButton}
                  />
                  <Button
                    title="Cancelar"
                    onPress={() => setIsEditing(false)}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <Text style={styles.userType}>Paciente</Text>
                <Button
                  title="Editar Perfil"
                  onPress={() => setIsEditing(true)}
                  variant="outline"
                  style={styles.editButton}
                />
              </>
            )}
          </View>
        </Card>

        <Card style={styles.associationCard}>
          <Text style={styles.cardTitle}>
            {nutritionist ? 'Meu Nutricionista' : 'Associar Nutricionista'}
          </Text>
          
          {nutritionist ? (
            <>
              <View style={styles.nutritionistInfo}>
                <View style={styles.nutritionistIcon}>
                  <Ionicons name="medical" size={32} color="#4CAF50" />
                </View>
                <View style={styles.nutritionistDetails}>
                  <Text style={styles.nutritionistName}>{nutritionist.name}</Text>
                  <Text style={styles.nutritionistEmail}>{nutritionist.email}</Text>
                </View>
              </View>
              <Button
                title="Remover Associação"
                onPress={handleRemoveAssociation}
                variant="outline"
                style={styles.removeButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.cardSubtitle}>
                Digite o código fornecido pelo seu nutricionista
              </Text>
              <Input
                placeholder="Código de associação"
                value={associationCode}
                onChangeText={setAssociationCode}
                style={styles.associationInput}
                autoCapitalize="characters"
              />
              <Button
                title={isAssociating ? "Associando..." : "Associar"}
                onPress={handleAssociateNutritionist}
                style={styles.associateButton}
                disabled={isAssociating}
              />
            </>
          )}
        </Card>

        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </Card>

        <Button
          title="Sair da Conta"
          onPress={() => {
            console.log('Botão Sair da Conta clicado');
            handleLogout();
          }}
          variant="outline"
          style={styles.logoutButton}
        />
        <Button
          title="Excluir conta"
          onPress={handleDeleteAccount}
          variant="outline"
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  userType: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 16,
  },
  editButton: {
    minWidth: 150,
  },
  editButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
  associationCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  associationInput: {
    marginBottom: 16,
  },
  associateButton: {
    alignSelf: 'flex-start',
  },
  nutritionistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  nutritionistIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nutritionistDetails: {
    flex: 1,
  },
  nutritionistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nutritionistEmail: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    borderColor: '#F44336',
    alignSelf: 'flex-start',
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    borderColor: '#F44336',
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: '#E53935',
    marginBottom: 32,
  },
});
