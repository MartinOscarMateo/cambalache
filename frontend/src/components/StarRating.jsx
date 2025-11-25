

export default function StarRating({ rating, onChange }) {
  return (
    <div className="flex justify-center gap-2 cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            fontSize: "28px",
            color: star <= rating ? "#ffc107" : "#ccc"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
