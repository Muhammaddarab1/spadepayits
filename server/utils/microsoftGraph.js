/**
 * Microsoft Graph API client
 * Authenticates with Azure AD and fetches users from Microsoft 365 tenant
 */
import axios from 'axios';

const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';
let cachedAccessToken = null;
let tokenExpiry = null;

/**
 * Get an access token from Azure AD
 * Uses Client Credentials flow (app-to-app authentication)
 */
export const getAccessToken = async () => {
  // Return cached token if still valid
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Missing Azure AD credentials: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET'
    );
  }

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedAccessToken = response.data.access_token;
    // Cache token for 55 minutes (expires in 3600s, refresh at 3300s)
    tokenExpiry = Date.now() + 3300000;

    return cachedAccessToken;
  } catch (error) {
    console.error('Failed to get Azure AD token:', error.response?.data || error.message);
    throw new Error('Authentication failed with Azure AD');
  }
};

/**
 * Fetch all users from the Microsoft 365 tenant
 * Returns: Array of users with id, displayName, mail, jobTitle, department
 */
export const getMicrosoftUsers = async () => {
  try {
    const token = await getAccessToken();
    let allUsers = [];
    let nextLink = `${GRAPH_API_ENDPOINT}/users?$select=id,displayName,mail,jobTitle,department,officeLocation`;

    // Handle pagination
    while (nextLink) {
      const response = await axios.get(nextLink, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      allUsers = allUsers.concat(
        response.data.value.map((user) => ({
          microsoftId: user.id,
          name: user.displayName,
          email: user.mail,
          jobTitle: user.jobTitle || '',
          department: user.department || '',
          officeLocation: user.officeLocation || '',
        }))
      );

      // Check for next page
      nextLink = response.data['@odata.nextLink'];
    }

    return allUsers;
  } catch (error) {
    console.error('Failed to fetch users from Microsoft Graph:', error.message);
    throw error;
  }
};

/**
 * Get a specific user from Microsoft 365
 */
export const getMicrosoftUser = async (microsoftId) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${GRAPH_API_ENDPOINT}/users/${microsoftId}?$select=id,displayName,mail,jobTitle,department`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      microsoftId: response.data.id,
      name: response.data.displayName,
      email: response.data.mail,
      jobTitle: response.data.jobTitle || '',
      department: response.data.department || '',
    };
  } catch (error) {
    console.error(`Failed to fetch user ${microsoftId}:`, error.message);
    throw error;
  }
};

/**
 * Search users by email in Microsoft 365
 */
export const searchMicrosoftUserByEmail = async (email) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${GRAPH_API_ENDPOINT}/users?$filter=mail eq '${email}'&$select=id,displayName,mail,jobTitle,department`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.value.length === 0) return null;

    const user = response.data.value[0];
    return {
      microsoftId: user.id,
      name: user.displayName,
      email: user.mail,
      jobTitle: user.jobTitle || '',
      department: user.department || '',
    };
  } catch (error) {
    console.error(`Failed to search user by email ${email}:`, error.message);
    throw error;
  }
};

/**
 * Verify that Azure AD credentials are configured
 */
export const validateMicrosoftConfig = () => {
  const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing environment variables: ${missing.join(', ')}`,
    };
  }

  return {
    valid: true,
    message: 'Microsoft Azure configuration is valid',
  };
};
