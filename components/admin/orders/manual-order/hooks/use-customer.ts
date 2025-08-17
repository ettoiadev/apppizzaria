import { useState, useEffect } from 'react';
import { Customer, CustomerAddress, ViaCEPResponse } from '../types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger'

export function useCustomer() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState<CustomerAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Debounced customer search
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (customerName.length >= 2) {
        searchCustomers(customerName);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [customerName]);

  const searchCustomers = async (searchTerm: string) => {
    if (searchTerm.length < 2) return;

    setIsSearchingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) {
        logger.error('MODULE', 'Erro ao buscar clientes:', error);
        return;
      }

      setCustomerSuggestions(data || []);
      setShowCustomerSuggestions(true);
    } catch (error) {
      logger.error('MODULE', 'Erro ao buscar clientes:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    
    // Preencher endereço se disponível
    if (customer.address) {
      setCustomerAddress({
        street: customer.address.street || '',
        number: customer.address.number || '',
        complement: customer.address.complement || '',
        neighborhood: customer.address.neighborhood || '',
        city: customer.address.city || '',
        state: customer.address.state || '',
        zipCode: customer.address.zipCode || ''
      });
    }
    
    setShowCustomerSuggestions(false);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setShowCustomerSuggestions(false);
  };

  const fetchAddressByCEP = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (!data.erro) {
        setCustomerAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          zipCode: cep
        }));
      }
    } catch (error) {
      logger.error('MODULE', 'Erro ao buscar CEP:', error);
    }
  };

  const handleZipCodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    setCustomerAddress(prev => ({ ...prev, zipCode: cleanValue }));
    
    if (cleanValue.length === 8) {
      fetchAddressByCEP(cleanValue);
    }
  };

  const updateCustomerAddress = (field: keyof CustomerAddress, value: string) => {
    setCustomerAddress(prev => ({ ...prev, [field]: value }));
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  };

  const isCustomerValid = () => {
    return customerName.trim() !== '' && 
           customerPhone.trim() !== '' && 
           customerAddress.street.trim() !== '' &&
           customerAddress.number.trim() !== '' &&
           customerAddress.neighborhood.trim() !== '' &&
           customerAddress.city.trim() !== '' &&
           customerAddress.state.trim() !== '' &&
           customerAddress.zipCode.trim() !== '';
  };

  return {
    // State
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerSuggestions,
    showCustomerSuggestions,
    isSearchingCustomers,
    selectedCustomer,
    
    // Actions
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setShowCustomerSuggestions,
    handleCustomerSelect,
    handleNewCustomer,
    handleZipCodeChange,
    updateCustomerAddress,
    clearCustomer,
    
    // Computed
    isCustomerValid
  };
}