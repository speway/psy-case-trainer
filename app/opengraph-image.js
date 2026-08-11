import { ImageResponse } from "next/og";

export const alt =
  "Тренажёр психолога — учебная площадка Научного сектора психологии ТФ МГУ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#f3efe6",
          color: "#17332d",
          fontFamily: "sans-serif",
          padding: "44px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            border: "3px solid #17332d",
            borderRadius: "28px",
            padding: "52px 60px 44px",
            background: "#f8f4ec",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  background: "#17332d",
                  color: "#f3efe6",
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                Ψ
              </div>
              Научный сектор психологии ТФ МГУ
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "11px 20px",
                borderRadius: 999,
                background: "#dce8df",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Учебная платформа
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 820,
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#c7694c",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Практика профессионального мышления
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 74,
                lineHeight: 1.02,
                letterSpacing: "-0.045em",
                fontWeight: 800,
              }}
            >
              Тренажёр психолога
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 29,
                lineHeight: 1.35,
                color: "#36534c",
              }}
            >
              Учебные кейсы · методика КАРТА · разбор ошибок
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 20,
              color: "#536c65",
            }}
          >
            <div style={{ display: "flex" }}>10 кейсов разной сложности</div>
            <div
              style={{
                display: "flex",
                height: 4,
                width: 300,
                borderRadius: 99,
                background: "#c7694c",
              }}
            />
            <div style={{ display: "flex", fontWeight: 700 }}>psy-case-trainer.vercel.app</div>
          </div>

          <div
            style={{
              position: "absolute",
              right: -55,
              bottom: 70,
              width: 310,
              height: 310,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "34px solid rgba(199, 105, 76, 0.12)",
              color: "rgba(23, 51, 45, 0.09)",
              fontSize: 240,
              fontWeight: 700,
            }}
          >
            Ψ
          </div>
        </div>
      </div>
    ),
    size,
  );
}
