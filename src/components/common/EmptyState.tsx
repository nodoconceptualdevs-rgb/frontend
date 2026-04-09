import React from "react";
import { Empty } from "antd";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ 
  icon, 
  title = "No hay datos disponibles", 
  description,
  action 
}: EmptyStateProps) {
  return (
    <Empty
      image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <p style={{ 
            fontSize: "18px", 
            fontWeight: 600, 
            marginBottom: "8px", 
            color: "#374151" 
          }}>
            {title}
          </p>
          {description && (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              {description}
            </p>
          )}
        </div>
      }
      style={{ padding: "60px 0" }}
    >
      {action}
    </Empty>
  );
}
