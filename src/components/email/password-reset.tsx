import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

export type PasswordResetEmailProps = {
  name?: string | null;
  resetUrl: string;
};

const colors = {
  bg: "#0e0d0b",
  surface: "#171613",
  surfaceRaised: "#201e1a",
  fg: "#f3efe6",
  muted: "#9c9688",
  subtle: "#6e6a60",
  line: "#302e29",
  accent: "#d8d2c4",
  accentFg: "#0e0d0b",
};

export const PasswordResetEmail = Object.assign(
  function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
    const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";

    return (
      <Html lang="en">
        <Head />
        <Body
          style={{
            backgroundColor: colors.bg,
            color: colors.fg,
            fontFamily: '"Figtree", Arial, sans-serif',
            margin: 0,
            padding: 0,
          }}
        >
          <Preview>A quiet link to choose a new Still password.</Preview>
          <Container style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
            <Section style={{ padding: "0 4px 24px" }}>
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: "22px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: "28px",
                  margin: 0,
                }}
              >
                Still
              </Text>
              <Text
                style={{
                  color: colors.subtle,
                  fontSize: "11px",
                  letterSpacing: "0.16em",
                  lineHeight: "16px",
                  margin: "6px 0 0",
                  textTransform: "uppercase",
                }}
              >
                A quiet place to come back to
              </Text>
            </Section>

            <Section
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: "18px",
                padding: "36px 32px 32px",
              }}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  lineHeight: "18px",
                  margin: "0 0 14px",
                  textTransform: "uppercase",
                }}
              >
                Account access
              </Text>
              <Heading
                as="h1"
                style={{
                  color: colors.fg,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: "34px",
                  fontWeight: 500,
                  letterSpacing: "-0.035em",
                  lineHeight: "40px",
                  margin: "0 0 24px",
                }}
              >
                A quiet reset.
              </Heading>
              <Text style={{ color: colors.fg, fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}>
                {greeting}
              </Text>
              <Text style={{ color: colors.muted, fontSize: "15px", lineHeight: "25px", margin: "0 0 24px" }}>
                Someone asked to choose a new password for your Still account. The link below will be available for
                one hour.
              </Text>
              <Button
                href={resetUrl}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: "9px",
                  boxSizing: "border-box",
                  color: colors.accentFg,
                  display: "inline-block",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "20px",
                  padding: "14px 20px",
                  textDecoration: "none",
                }}
              >
                Choose a new password
              </Button>
              <Hr style={{ border: "none", borderTop: `1px solid ${colors.line}`, margin: "32px 0 24px" }} />
              <Text style={{ color: colors.subtle, fontSize: "13px", lineHeight: "21px", margin: 0 }}>
                If you did not ask for this, you can ignore the email. Your password will stay the same.
              </Text>
            </Section>

            <Section style={{ padding: "24px 4px 0" }}>
              <Text style={{ color: colors.subtle, fontSize: "12px", lineHeight: "19px", margin: "0 0 8px" }}>
                If the button does not work, copy this link into your browser:
              </Text>
              <Link
                href={resetUrl}
                style={{ color: colors.muted, fontSize: "12px", lineHeight: "19px", wordBreak: "break-all" }}
              >
                {resetUrl}
              </Link>
              <Text style={{ color: colors.subtle, fontSize: "12px", lineHeight: "19px", margin: "24px 0 0" }}>
                Still · a companion, not care
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  },
  {
    PreviewProps: {
      name: "Maya",
      resetUrl: "https://still-orpin-ten.vercel.app/reset-password?token=preview-token",
    } satisfies PasswordResetEmailProps,
  },
);
