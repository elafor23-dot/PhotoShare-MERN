import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [posting, setPosting] = useState(false);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API}/api/posts`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin ? "login" : "register";

      const response = await fetch(`${API}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setActivePage("home");
      setMessage(data.message);
      await fetchPosts();
    } catch (error) {
      setMessage(error.message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (!postText.trim() && !postImage) {
      setMessage("Choose an image or write something");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      const postData = new FormData();
      postData.append("text", postText);

      if (postImage) {
        postData.append("image", postImage);
      }

      const response = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: postData
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setPostText("");
      setPostImage(null);
      e.target.reset();

      await fetchPosts();
      setMessage("Post published successfully!");
    } catch (error) {
      setMessage(error.message || "Could not create post");
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setEditText(post.text || "");
  };

  const saveEdit = async (postId) => {
    try {
      const response = await fetch(`${API}/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ text: editText })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setEditingPostId(null);
      setEditText("");
      await fetchPosts();
      setMessage("Comment updated successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteComment = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/api/posts/${postId}/comment`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      await fetchPosts();
      setMessage("Comment deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setMessage("");
    setActivePage("home");
  };

  return (
    <div className="main-container">

      <header className="navbar">
        <h1 className="brand">PhotoShare 📸</h1>

        <nav>
          <button onClick={() => {
            setActivePage("home");
            setMessage("");
          }}>
            Home
          </button>

          <button onClick={() => {
            setActivePage("gallery");
            setMessage("");
            fetchPosts();
          }}>
            Gallery
          </button>

          {user ? (
            <button onClick={logout}>Logout</button>
          ) : (
            <button onClick={() => {
              setActivePage("login");
              setMessage("");
            }}>
              Please Login
            </button>
          )}
        </nav>
      </header>

      {activePage === "home" && (
        <main className="home-content">

          {!user ? (
            <section className="welcome-section">
              <h1>Welcome to PhotoShare</h1>
              <p>Share your beautiful memories with the world.</p>

              <button onClick={() => setActivePage("login")}>
                Get Started
              </button>
            </section>
          ) : (
            <>
              <h2>Welcome, {user.name} ❤️</h2>

              <form className="post-form" onSubmit={handlePost}>
                <h2>Create a Post</h2>

                <textarea
                  placeholder="What's on your mind?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />

                <label className="upload-label">
                  📷 Choose an Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPostImage(e.target.files[0])}
                  />
                </label>

                {postImage && <p>{postImage.name}</p>}

                <button type="submit" disabled={posting}>
                  {posting ? "Publishing..." : "Publish Post"}
                </button>
              </form>

              <button className="gallery-button" onClick={() => {
                setActivePage("gallery");
                fetchPosts();
              }}>
                Explore Gallery
              </button>
            </>
          )}
        </main>
      )}

      {activePage === "gallery" && (
        <main className="gallery-section">
          <h2>Our Gallery</h2>
          <p className="gallery-subtitle">
            Beautiful memories shared by our community.
          </p>

          {message && <p className="message">{message}</p>}

          <div className="gallery-grid">
            {posts.filter(post => post.image).map((post) => (
              <article className="gallery-card" key={post._id}>
                <img
                  src={`${API}${post.image}`}
                  alt="Shared memory"
                />

                <div className="gallery-info">
                  <h3>{post.user?.name || "Unknown User"}</h3>

                  {editingPostId === post._id ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />

                      <button onClick={() => saveEdit(post._id)}>
                        Save
                      </button>

                      <button onClick={() => {
                        setEditingPostId(null);
                        setEditText("");
                      }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <p>{post.text}</p>
                  )}

                  {user && post.user?.email === user.email && (
                    <div className="post-actions">
                      {editingPostId !== post._id && (
                        <>
                          <button onClick={() => handleEdit(post)}>
                            Edit Comment
                          </button>

                          <button onClick={() => deleteComment(post._id)}>
                            Delete Comment
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {posts.filter(post => post.image).length === 0 && (
            <p className="empty-message">
              No images yet. Be the first to share!
            </p>
          )}
        </main>
      )}

      {activePage === "login" && (
        <main className="auth-section">
          <div className="auth-card">

            <h1 className="auth-logo">PhotoShare 📸</h1>

            <p className="subtitle">
              Share your memories with the world
            </p>

            <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                minLength="6"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." :
                  isLogin ? "Login" : "Create Account"}
              </button>
            </form>

            <p className="switch-text">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <span onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}>
                {isLogin ? " Sign Up" : " Login"}
              </span>
            </p>

            {message && <p className="message">{message}</p>}

          </div>
        </main>
      )}

      <footer className="footer">
        <p>© 2026 PhotoShare. All Rights Reserved.</p>
      </footer>

    </div>
  );
}

export default App;
