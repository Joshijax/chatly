const generateCode = async () => {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log(code, "code");
  return `${code}`;
};

export { generateCode };
