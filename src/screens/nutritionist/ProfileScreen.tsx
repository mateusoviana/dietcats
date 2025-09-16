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

  const menuItems = [
    {
      icon: 'people-outline',
      title: 'Meus Pacientes',
      subtitle: 'Gerenciar pacientes associados',
      onPress: () => {},
    },
    {
      icon: 'trophy-outline',
      title: 'Minhas Competições',
      subtitle: 'Ver e editar competições',
      onPress: () => {},
    },
    {
      icon: 'analytics-outline',
      title: 'Relatórios',
      subtitle: 'Análises e estatísticas',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      title: 'Notificações',
      subtitle: 'Configurar alertas',
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
                <Text style={styles.userType}>Nutricionista</Text>
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

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estatísticas Gerais</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Pacientes Ativos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Competições Ativas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Check-ins Hoje</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Taxa de Adesão</Text>
            </View>
          </View>
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
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
