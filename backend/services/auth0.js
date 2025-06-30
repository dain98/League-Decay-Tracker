import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;

const getUserProfileFromAuth0 = async (accessToken) => {
  try {
    const response = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile from Auth0:', error.response?.data || error.message);
    throw new Error('Failed to fetch user profile from Auth0');
  }
};

export default getUserProfileFromAuth0; 
