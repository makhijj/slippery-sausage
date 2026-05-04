export const hasToken = () => {
  return document.cookie.split(";").some((c) => c.trim().startsWith("token="));
};

export const getToken = () => {
  return document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];
};

export const getUsernameFromToken = () => {
  const token = getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || null;
    } catch {
      return null;
    }
  }
  return null;
};
