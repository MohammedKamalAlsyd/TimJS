import React from 'react';

const empty = () => {
  return (
    <div>
      {/* Main Header */}
      <header>
        <h1>This is Header 1: The Main Title of the Page</h1>
        <p>This header typically represents the main title or theme of the page.</p>
        
        {/* Subheader */}
        <h2>This is Header 2: A Subheading</h2>
        <p>This subheading is used to introduce sections or important subsections of the content.</p>
      </header>

      {/* Unordered List Section */}
      <section>
        <h3>Unordered List Example</h3>
        <p>The unordered list below is used to display a list of items where the order does not matter:</p>
        <ul>
          <li>Item 1: This is the first item in the unordered list.</li>
          <li>Item 2: This item follows the first one.</li>
          <li>Item 3: The third item in the list.</li>
        </ul>
      </section>

      {/* Ordered List Section */}
      <section>
        <h3>Ordered List Example</h3>
        <p>The ordered list below is used to display items where the sequence is important:</p>
        <ol>
          <li>First: This is the first item in the ordered list.</li>
          <li>Second: This item follows the first one.</li>
          <li>Third: The third item in the sequence.</li>
        </ol>
      </section>

      {/* Table Section */}
      <section>
        <h3>Table Example</h3>
        <p>The table below is used to organize data into rows and columns:</p>
        <table border="1">
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
              <th>Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row 1, Cell 1</td>
              <td>Row 1, Cell 2</td>
              <td>Row 1, Cell 3</td>
            </tr>
            <tr>
              <td>Row 2, Cell 1</td>
              <td>Row 2, Cell 2</td>
              <td>Row 2, Cell 3</td>
            </tr>
            <tr>
              <td>Row 3, Cell 1</td>
              <td>Row 3, Cell 2</td>
              <td>Row 3, Cell 3</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default empty;
