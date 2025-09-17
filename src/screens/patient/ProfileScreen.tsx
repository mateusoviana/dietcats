import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [associationCode, setAssociationCode] = useState('');

  const handleSave = () => {
    // Aqui seria implementada a lógica de salvamento
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleAssociateNutritionist = () => {
    if (!associationCode.trim()) {
      Alert.alert('Erro', 'Digite o código de associação');
      return;
    }

    Alert.alert(
      'Associação',
      'Associação com nutricionista realizada com sucesso!',
      [{ text: 'OK', onPress: () => setAssociationCode('') }]
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
                <Input
                  label="Nome"
                  value={name}
                  onChangeText={setName}
                  placeholder="Digite seu nome"
                />
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Digite seu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
          <Text style={styles.cardTitle}>Associar Nutricionista</Text>
          <Text style={styles.cardSubtitle}>
            Digite o código fornecido pelo seu nutricionista
          </Text>
          <Input
            placeholder="Código de associação"
            value={associationCode}
            onChangeText={setAssociationCode}
            style={styles.associationInput}
          />
          <Button
            title="Associar"
            onPress={handleAssociateNutritionist}
            style={styles.associateButton}
          />
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
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
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
    marginBottom: 32,
  },
});
