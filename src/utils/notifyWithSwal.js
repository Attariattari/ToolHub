const { default: Swal } = require("sweetalert2");

const showSuccessMessage = (message) => {
  Swal.fire({
    title: localStorage.getItem("language") === "ar" ? "تم النجاح!" : "Success!",
    text: message,
    icon: "success",
    iconColor: "#4a90e2",
    confirmButtonColor: "#4a90e2"
  });
};

const showErrorMessage = (message) => {
  Swal.fire({
    title: localStorage.getItem("language") === "ar" ? "خطأ!" : "Error!",
    text: message,
    icon: "error",
    iconColor: "#e74c3c",
    confirmButtonColor: "#e74c3c"
  });
};

export {
  showSuccessMessage,
  showErrorMessage
}