import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "react-email";

export function VerifyEmail({ name, verifyUrl }: { name?: string | null; verifyUrl: string }) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#0e0d0b", color: "#f3efe6", fontFamily: '"Figtree", Arial, sans-serif', margin: 0, padding: 0 }}>
        <Preview>One small step to keep your Still space yours.</Preview>
        <Container style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
          <Section style={{ padding: "0 4px 24px" }}>
            <Text style={{ color: "#f3efe6", fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 600, margin: 0 }}>Still</Text>
            <Text style={{ color: "#6e6a60", fontSize: "11px", letterSpacing: "0.16em", margin: "6px 0 0", textTransform: "uppercase" }}>A quiet place to come back to</Text>
          </Section>
          <Section style={{ backgroundColor: "#171613", border: "1px solid #302e29", borderRadius: "18px", padding: "36px 32px 32px" }}>
            <Text style={{ color: "#9c9688", fontSize: "12px", letterSpacing: "0.14em", margin: "0 0 14px", textTransform: "uppercase" }}>Your account</Text>
            <Heading as="h1" style={{ color: "#f3efe6", fontFamily: "Georgia, serif", fontSize: "34px", fontWeight: 500, letterSpacing: "-0.035em", lineHeight: "40px", margin: "0 0 24px" }}>Keep your space yours.</Heading>
            <Text style={{ color: "#f3efe6", fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}>{greeting}</Text>
            <Text style={{ color: "#9c9688", fontSize: "15px", lineHeight: "25px", margin: "0 0 24px" }}>Confirm this email to finish setting up your Still account. The link is good for 24 hours.</Text>
            <Button href={verifyUrl} style={{ backgroundColor: "#d8d2c4", borderRadius: "9px", boxSizing: "border-box", color: "#0e0d0b", display: "inline-block", fontSize: "14px", fontWeight: 600, lineHeight: "20px", padding: "14px 20px", textDecoration: "none" }}>Confirm email</Button>
            <Hr style={{ border: "none", borderTop: "1px solid #302e29", margin: "32px 0 24px" }} />
            <Text style={{ color: "#6e6a60", fontSize: "13px", lineHeight: "21px", margin: 0 }}>If you did not create this account, you can ignore this email.</Text>
          </Section>
          <Text style={{ color: "#6e6a60", fontSize: "12px", lineHeight: "19px", margin: "24px 4px 0" }}>Still · a companion, not care</Text>
        </Container>
      </Body>
    </Html>
  );
}
