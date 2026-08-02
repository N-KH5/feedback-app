function RatingQuestion({
  questionId,
  question,
  value,
  onChange,
  ratingLabels,
}) {
  return (
    <div className="rating-question">
      <p className="question-text">{question}</p>

      <div className="rating-options">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label
            key={rating}
            className={
              value === rating
                ? "rating active"
                : "rating"
            }
          >
            <input
              type="radio"
              name={`question-${questionId}`}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
            />

            <span className="rating-number">
              {rating}
            </span>

            <span className="rating-label">
              {ratingLabels[rating]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default RatingQuestion;