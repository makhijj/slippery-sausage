//helper functions
export function isValidUsername(username: string): boolean {
  if (username.length < 3 || username.length > 20) {
    return false;
  }

  for (let i = 0; i < username.length; i++) {
    const char = username[i];
    if (!char) {
      return false;
    }

    const letter = (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");

    const num = char >= "0" && char <= "9";

    if (!num && !letter) {
      return false;
    }
  }

  return true;
}

export function isValidPass(password: string): boolean {
  if (password.length < 8) {
    return false;
  }

  let hasLetter,
    hasNumber = false;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];

    if (!char) {
      continue;
    }

    if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z")) {
      hasLetter = true;
    }

    if (char >= "0" && char <= "9") {
      hasNumber = true;
    }
  }

  if (!hasNumber || !hasLetter) {
    return false;
  }
  return true;
}

export function isValidEmail(email: string): boolean {
  if (email.includes(" ")) {
    return false;
  }

  const i = email.indexOf("@");

  if (i < 0 || i === email.length - 1) {
    return false;
  }

  const dotIdx = email.lastIndexOf(".");

  if (dotIdx <= i + 1 || dotIdx === email.length - 1) {
    return false;
  }

  return true;
}
