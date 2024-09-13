import React from 'react';
import styled from 'styled-components';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const PageContainer = styled.div`
  font-family: Roboto, Inter, sans-serif;
  color: #272B30;
  text-align: center;
  background-color: aliceblue;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

const Header = styled.h1`
  font-size: 22px;
  font-weight: 700;
`;

const SubHeader = styled.h2`
  font-size: 14px;
  font-weight: 400;
`;

const Section = styled.div`
  width: 80%;
  margin: 20px 0;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
`;

const data = {
  labels: ['Facebook', 'Instagram', 'Twitter'],
  datasets: [
    {
      label: 'Usage Time',
      data: [30, 45, 20],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    },
  ],
};

const HomePage = () => {
  return (
    <PageContainer>
      <Header>Current Dashboard (27/09/2019)</Header>
      <Section>
        <SubHeader>Wasted Time</SubHeader>
        <p>31 Minutes</p>
      </Section>
      <Section>
        <SubHeader>Work Time</SubHeader>
        <p>1 Hour 32 Minutes</p>
      </Section>
      <Section>
        <SubHeader>Usage Summary</SubHeader>
        <ChartContainer>
          <Bar data={data} />
        </ChartContainer>
      </Section>
      <Section>
        <SubHeader>Last Account Sync Log</SubHeader>
        <p>10:40 AM, Fri., Sept. 10, 2019</p>
        <p>Data Stored On Google Drive: https://drive.google.com/drive/folders/TimJS/2019-09-10_10-40.JSON</p>
      </Section>
    </PageContainer>
  );
};

export default HomePage;
