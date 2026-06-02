interface GoogleCredentialResponse {
  credential?: string;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            width?: number | string;
            text?: 'signup_with' | 'signin_with' | 'continue_with';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            locale?: string;
          },
        ) => void;
        prompt: () => void;
      };
    };
  };
}
