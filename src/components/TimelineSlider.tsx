import React, { useEffect, useRef, useState } from "react";
import { Slider, Typography, Button, Space } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { useStore } from "../store/useStore";
import dayjs from "dayjs";

const { Text } = Typography;

const TimelineSlider: React.FC = () => {
  const { selectedTimeRange, setTimeRange } = useStore();
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedTimeRange[1] === 0 && selectedTimeRange[0] === 0) {
      setTimeRange([-24, 0]);
    }
    // eslint-disable-next-line
  }, []);

  const stepForward = () => {
    setTimeRange([selectedTimeRange[0] + 1, selectedTimeRange[1] + 1]);
  };

  const start = () => {
    setPlaying(true);
    intervalRef.current = window.setInterval(stepForward, 1000);
  };

  const stop = () => {
    setPlaying(false);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Text strong>Timeline (±15 days)</Text>
          </div>
          <div>
            <Button
              size="small"
              onClick={() => (playing ? stop() : start())}
              icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            >
              {playing ? "Pause" : "Play"}
            </Button>
          </div>
        </div>
        <Slider
          range
          min={-15 * 24}
          max={15 * 24}
          step={1}
          value={selectedTimeRange}
          onChange={(val) => setTimeRange(val as [number, number])}
          tooltip={{
            formatter: (v) =>
              typeof v === "number" ? (v >= 0 ? `+${v}h` : `${v}h`) : "",
          }}
        />
        <div>
          <Text type="secondary">
            From{" "}
            <strong>
              {dayjs().add(selectedTimeRange[0], "hour").format("MMM D, HH:mm")}
            </strong>{" "}
            to{" "}
            <strong>
              {dayjs().add(selectedTimeRange[1], "hour").format("MMM D, HH:mm")}
            </strong>
          </Text>
        </div>
      </Space>
    </div>
  );
};

export default TimelineSlider;
