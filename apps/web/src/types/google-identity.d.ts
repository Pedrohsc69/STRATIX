type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
};

type GoogleButtonConfiguration = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?:
    | 'signin_with'
    | 'signup_with'
    | 'continue_with'
    | 'signin'
    | 'signup'
    | 'continue';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  logo_alignment?: 'left' | 'center';
};

type GoogleAccountsId = {
  initialize: (configuration: GoogleIdConfiguration) => void;
  renderButton: (element: HTMLElement, configuration: GoogleButtonConfiguration) => void;
};

type GoogleAccounts = {
  id: GoogleAccountsId;
};

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
}
