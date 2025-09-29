import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  const id = post.id || post._id;
  const img = Array.isArray(post.images) && post.images[0] ? post.images[0] : '';
  return (
    <Link to={`/posts/${id}`} className="card">
      {img ? <img src={img} alt={post.title} className="card-img" /> : <div className="card-placeholder">Sin imagen</div>}
      <div className="card-body">
        <h3 className="card-title">{post.title}</h3>
        <p className="card-meta">{post.category}</p>
      </div>
    </Link>
  );
}