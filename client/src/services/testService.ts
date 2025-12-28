import axiosInstance from '../config/axiosConfig';

export const testAPI = async () => {
  try {
    // Test API connection
    const response = await axiosInstance.get('/test');
    console.log('✅ API Connection Test Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Connection Test Failed:', error);
    throw error;
  }
};

export const loginTest = async () => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      email: 'customer@example.com',
      password: 'Customer123'
    });
    console.log('✅ Login Test Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Login Test Failed:', error);
    throw error;
  }
};

export const getMenuItems = async () => {
  try {
    const response = await axiosInstance.get('/menu-items');
    console.log('✅ Get Menu Items Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get Menu Items Failed:', error);
    throw error;
  }
};