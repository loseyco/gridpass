import * as React from 'react';

const mainStyle = {
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
    backgroundColor: '#09090b',
    color: '#ffffff',
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
};

const containerStyle = {
    backgroundColor: '#18181b',
    borderRadius: '12px',
    border: '1px solid #27272a',
    padding: '40px',
    textAlign: 'center' as const,
};

const buttonStyle = {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
    marginTop: '20px',
};

const textStyle = {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '16px 0',
};

const titleStyle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
};

export const WelcomeEmail = ({ incidentTitle, incidentId }: { incidentTitle: string, incidentId: string }) => (
    <div style={mainStyle}>
        <div style={containerStyle}>
            <h1 style={titleStyle}>Incident Submitted</h1>
            <p style={textStyle}>
                Your incident <strong>"{incidentTitle}"</strong> has been submitted to the Stewards Room.
            </p>
            <p style={textStyle}>
                The community will perform a review and vote on who is at fault. You'll receive daily updates on the voting progress.
            </p>
            <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/sim-racing/stewards/${incidentId}`} style={buttonStyle}>
                View Incident
            </a>
        </div>
    </div>
);

export const DailyUpdateEmail = ({
    incidentTitle,
    incidentId,
    votes
}: {
    incidentTitle: string,
    incidentId: string,
    votes: { driver_a: number, driver_b: number, racing_incident: number }
}) => {
    const total = votes.driver_a + votes.driver_b + votes.racing_incident;
    const aPct = total ? Math.round((votes.driver_a / total) * 100) : 0;
    const bPct = total ? Math.round((votes.driver_b / total) * 100) : 0;
    const riPct = total ? Math.round((votes.racing_incident / total) * 100) : 0;

    return (
        <div style={mainStyle}>
            <div style={containerStyle}>
                <h1 style={titleStyle}>Daily Update: Review in Progress</h1>
                <p style={textStyle}>
                    Here is the current status of the review for <strong>"{incidentTitle}"</strong>.
                </p>

                <div style={{ margin: '30px 0', textAlign: 'left' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '5px' }}>
                            <span>Driver A</span>
                            <span>{aPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#27272a', borderRadius: '4px' }}>
                            <div style={{ width: `${aPct}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '5px' }}>
                            <span>Driver B</span>
                            <span>{bPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#27272a', borderRadius: '4px' }}>
                            <div style={{ width: `${bPct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '5px' }}>
                            <span>Racing Incident</span>
                            <span>{riPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#27272a', borderRadius: '4px' }}>
                            <div style={{ width: `${riPct}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>

                <p style={textStyle}>
                    Total Votes: {total}
                </p>

                <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/sim-racing/stewards/${incidentId}`} style={buttonStyle}>
                    View Discussion
                </a>
            </div>
        </div>
    );
};

export const FinalVerdictEmail = ({
    incidentTitle,
    incidentId,
    verdict,
    votes
}: {
    incidentTitle: string,
    incidentId: string,
    verdict: string,
    votes: any
}) => (
    <div style={mainStyle}>
        <div style={containerStyle}>
            <h1 style={titleStyle}>Final Verdict</h1>
            <p style={textStyle}>
                The community review for <strong>"{incidentTitle}"</strong> has concluded.
            </p>

            <div style={{ margin: '30px 0', padding: '20px', backgroundColor: '#27272a', borderRadius: '8px' }}>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 10px 0' }}>The community has decided:</p>
                <h2 style={{ color: '#fff', fontSize: '28px', margin: 0 }}>{verdict}</h2>
            </div>

            <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/sim-racing/stewards/${incidentId}`} style={buttonStyle}>
                View Full Results
            </a>
        </div>
    </div>
);
