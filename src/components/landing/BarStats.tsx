import styles from "./BarStats.module.css";

const stats = [
  { value: "200", label: "Clientes" },
  { value: "10", label: "Años de experiencia" },
  { value: "1000", label: "Horas de trabajo" },
  { value: "30", label: "proyectos internacionales" },
];

export default function BarStats() {
  return (
    <section
      className={styles.barStatsContainer}
      aria-label="Estadísticas de la empresa"
    >
      {stats.map((stat, idx) => (
        <div key={stat.label} className={styles.statBox}>
          <span className={styles.statValue}>
            <span className={styles.statPlus}>+</span>
            {stat.value}
          </span>
          <span className={styles.statLabel}>{stat.label}</span>
          {idx < stats.length - 1 && (
            <div className={styles.divider} aria-hidden />
          )}
        </div>
      ))}
    </section>
  );
}
