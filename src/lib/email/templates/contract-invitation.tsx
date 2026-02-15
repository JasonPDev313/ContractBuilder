import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ContractInvitationEmailProps {
  name: string
  contractTitle: string
  signUrl: string
}

export function ContractInvitationEmail({
  name,
  contractTitle,
  signUrl,
}: ContractInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Please sign: {contractTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Hi {name},</Text>
            <Text style={paragraph}>
              You have been invited to sign a contract: <strong>{contractTitle}</strong>
            </Text>
            <Button style={button} href={signUrl}>
              Review and Sign Contract
            </Button>
            <Text style={paragraph}>
              This link is unique to you and should not be shared.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
}

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
}
