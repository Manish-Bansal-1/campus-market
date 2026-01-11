import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const CreateListing = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const navigate = useNavigate();

  const submitItem = async (e) => {
    e.preventDefault();

    if (!localStorage.getItem("token")) {
      alert("Please login again");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("image", image);

    try {
      await API.post("/items/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Item listed successfully!");
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to list item");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sell Item</h2>

        <form className="auth-form" onSubmit={submitItem}>
          <input
            className="auth-input"
            placeholder="Item name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="auth-input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            className="auth-input"
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />

          <button className="auth-btn">Post Item</button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
