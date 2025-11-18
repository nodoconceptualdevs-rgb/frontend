import React from "react";
import styles from "./CourseCard.module.css";

export interface CourseCardProps {
  image: string;
  price: string;
  title: string;
  description: string;
  lessons: number;
  tests: number;
  rating: number; // 0-5
  onBuy?: () => void;
}

const MAX_DESCRIPTION_LENGTH = 160;

export const CourseCard: React.FC<CourseCardProps> = ({
  image,
  price,
  title,
  description,
  lessons,
  rating,
  onBuy,
}) => {
  // Truncate description for pixel-perfect look
  const truncatedDescription =
    description.length > MAX_DESCRIPTION_LENGTH
      ? description.slice(0, MAX_DESCRIPTION_LENGTH) + "..."
      : description;

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.imageBox}>
        <img src={image} alt={title} className={styles.image} />
        <div className={styles.priceTag}>{price}</div>
      </div>
      <div className={styles.infoRow}>
        <div className={styles.iconText}>
          <span className={styles.icon} aria-label="lecciones">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
                stroke="#6B6B6B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 19h16"
                stroke="#6B6B6B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 7h8"
                stroke="#6B6B6B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.infoText}>{lessons} lecciones</span>
        </div>

        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg
              key={i}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={i <= rating ? "#FFD600" : "#E0E0E0"}
              xmlns="http://www.w3.org/2000/svg"
              className={styles.star}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{truncatedDescription}</div>
      <button className={styles.buyButton} onClick={onBuy} type="button">
        Comprar curso
      </button>
    </div>
  );
};

export default CourseCard;
