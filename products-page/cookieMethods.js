function checkCookieForBadProduct() {
  return new Promise((resolve, reject) => {
    document.cookie.split(";").some((item) => {
      return item.includes("failedProduct");
    })
      ? resolve(document.cookie?.split("=")[1]?.split(","))
      : reject();
  });
}
export { checkCookieForBadProduct };
