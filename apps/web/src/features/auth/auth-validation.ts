// Copy shared by the login and signup views. What a field may be is not here:
// the forms import those rules from `@arena/contracts`, the same values the
// API's schemas enforce, so a form cannot drift from what the API accepts.
export const LOGIN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha.';
