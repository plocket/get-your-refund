// ==UserScript==
// @name         At-a-glance GYR Hub client layout
// @namespace    http://getyourrefund.org/
// @version      0.1
// @description  Rearrange the clients table to show more important info first.
// @match        https://*.getyourrefund.org/en/hub
// @match        https://*.getyourrefund.org/en/hub/clients
// @match        https://*.getyourrefund.org/en/hub/clients?*
// @match        https://*.getyourrefund.org/en/hub/clients/sla-breaches?*
// @match        https://*.getyourrefund.org/en/hub/clients/sla-breaches
// ==/UserScript==

// // <script data-main="scripts/app" src="scripts/require.js"></script>
// let require_script = document.createElement('script');
// require_script.src = 'scripts/require.js';
// document.body.appendChild( require_script );
// let moment_script = document.createElement('<script src="moment.js"></script>');
// let days_script = document.createElement('<script src="moment-business-days.js"></script>');

// let business_days = require('moment-business-days');

var squish = function () {

  // // Prevent stuff from being added multiple times (implement after development)
  // if ( document.querySelector('.org_subtitle')  ) { return; }

  // // Be able to turn dates into business days
  // let moment_script = document.createElement('script');
  // moment_script.src = 'moment.js';
  // document.body.appendChild( moment_script );
  // let days_script = document.createElement('script');
  // days_script.src = 'moment-business-days.js';
  // document.body.appendChild( days_script );

  // let diff = moment('Mar 12 2:13 AM', 'MMMM DD LT').businessDiff(moment());
  // console.log( diff );

  // Turning the dates into business days
  // IMPORTANT: Only works for client dates in the same year as today
  let today = new Date();
  let this_year = today.getFullYear();
  let one_day_ms = 1000 * 60 * 60 * 24;

  let column_headers = document.querySelectorAll('table.client-table thead th');
  let name_header_index = 1;
  let id_index = 2;
  let org_header_index = 3;
  let lang_header_index = 4;
  let unemployment_index = 5;
  let updated_index = 6;
  let waiting_index = 7;
  let created_index = 8;
  for ( let header_i = 0; header_i < column_headers.length; header_i++ ) {
    let text = column_headers[ header_i ].innerText;
    if ( text === 'Name' ) { name_header_index = header_i; }
    if ( text === 'Client ID' ) { id_index = header_i; }
    if ( text === 'Organization' ) { org_header_index = header_i; }
    if ( text === 'Language' ) { lang_header_index = header_i; }
    if ( text === 'UI' ) { unemployment_index = header_i; }
    // Don't change wording of headings right now. The current headings
    //  are in the documentation.
    if ( text === 'Updated At' ) { updated_index = header_i; }
    if ( text === 'Waiting on response' ) {
      waiting_index = header_i;
      column_headers[ header_i ].querySelector('span').innerHTML = 'Waiting on<br>response';  // Less wide
    }
    if ( text === 'Created at' ) { created_index = header_i; }
  }

  let new_info_data = [];

  let info_rows = document.querySelectorAll('table.client-table tbody tr');
  for ( let row of info_rows ) {

    let cols = row.querySelectorAll(':scope > *');

    let client_id = cols[ id_index ].innerText;
    let id_container = document.createElement('span');
    id_container.class = 'name_id_info';
    id_container.innerHTML = `(${ client_id })`

    let org_name = cols[ org_header_index ].innerText;

    let name_subtitle_container = document.createElement('div');
    name_subtitle_container.innerHTML = `<span class="bookmarklet_org_subtitle">${ org_name }</span>`;
    
    let name_cell = cols[ name_header_index ];
    let name_node = name_cell.querySelectorAll( 'a' )[0];
    name_node.appendChild( id_container );
    name_cell.appendChild( name_subtitle_container );

    // Change dates to days, but keep date data around in a tooltip
    let updated_days = '-';
    let waiting_days = '-';
    let created_days = '-';

    let updated_text = cols[ updated_index ].innerText;
    let waiting_text = cols[ waiting_index ].innerText;
    let created_text = cols[ created_index ].innerText;

    if ( updated_text ) {
      let date = new Date( updated_text + ` ${this_year}` );
      updated_days = Math.round(( today - date) / one_day_ms);
    }
    if ( waiting_text ) {
      let date = new Date( waiting_text + ` ${this_year}` );
      waiting_days = Math.round(( today - date) / one_day_ms);
    }
    if ( created_text ) {
      let date = new Date( created_text + ` ${this_year}` );
      created_days = Math.round(( today - date) / one_day_ms);
    }

    let with_tooltip = function ( text, tip ) {
      // Create a container with a visible element and a tootlip element
      return `
      <span class="bookmarklet tooltip">
        <span class="tooltip__trigger" title="" tabindex="0">${ text }</span>
        <span class="tooltip__body tooltip__body--bottom"  role="tooltip" aria-hidden="true" style="margin-left: 11.5px; margin-top: 24px;">${ tip }</span>
      </span>`;
    }

    cols[ updated_index ].innerHTML = with_tooltip( updated_days + ' days', `Includes weekends</br>${ updated_text }` );
    cols[ waiting_index ].innerHTML = with_tooltip( waiting_days + ' days', `Includes weekends</br>${ waiting_text }` );
    cols[ created_index ].innerHTML = with_tooltip( created_days + ' days', `Includes weekends</br>${ created_text }` );

    // Show the tooltip with extra info if appropriate
    document.body.addEventListener('mouseover', function( event ) {
      let target = event.target;
      if ( (' ' + target.className + ' ').indexOf(' ' + 'tooltip__trigger' + ' ') > -1 ) {
        let tip = target.parentNode.querySelector('.tooltip__body');
        tip.setAttribute( 'aria-hidden', 'false' );
        tip.classList.add( 'visible' );
      }
    })
    // Hide tooltip if needed
    document.body.addEventListener('mouseout', function( event ) {
      let target = event.target;
      if ( (' ' + target.className + ' ').indexOf(' ' + 'tooltip__trigger' + ' ') > -1 ) {
        let tip = target.parentNode.querySelector('.tooltip__body');
        tip.setAttribute( 'aria-hidden', 'true' );
        tip.classList.remove( 'visible' );
      }
    })
  
    // Add info from tax year columns

    // Prepare the new cell
    let tax_year_cell = document.createElement('td');
    tax_year_cell.className = 'index-table__cell';
    let tax_year_list = document.createElement('ol');  // `ul` in original, but why did they do an unordered list when the order does matter?
    tax_year_list.className = 'tax-return-list';
    tax_year_cell.appendChild( tax_year_list );

    // Add the contents of each year's list item
    let tax_year_rows_curr = row.querySelectorAll('.tax-return-list li');
    for ( let year_li_curr of tax_year_rows_curr ) {
      let li = document.createElement('li');
      li.className = year_li_curr.className;  // get the right tax return id

      let status_new = document.createElement('div');
      let status_node = year_li_curr.querySelector('.tax-return-list__status');
      status_new.innerHTML = status_node.outerHTML;
      status_new.className = status_node.className;

      li.appendChild( status_new );
      tax_year_list.appendChild( li );
    }

    // // Show some status items closer to the name column
    // let per_year = row.querySelectorAll('.tax-return-list li');
    // let years_data = [];
    // let years_cell = document.createElement('td');
    // let years_list = document.createElement('ul');
    // years_cell.appendChild( years_list );
    // for ( let year_row of per_year ) {
    //   let item = document.createElement('li');
    //   let year_text = year_row.querySelector( '.tax-return-list__year' ).innerText;
    //   let assignee = year_row.querySelector( '.tax-return-list__assignee' );
    //   let status = year_row.querySelector( '.tax-return-list__status' );
    //   item.innerHTML = `<span class="bookmarklet_tax_year">${ year_text }</span>`;
    //   item.appendChild( assignee );
    //   item.appendChild( status );
    //   years_data.push({ item, year: year_text, assignee, status });
    // }


    // Alternative data structure. Thoughts for refactoring.
    let row_data = {
      row,
      id: id_container,
      org: name_subtitle_container,
      years: tax_year_cell,
    }
    new_info_data.push( row_data );

  }  // ends for every non-header row

  let all_rows = document.querySelectorAll('table.client-table tr');

  // Move the low-priority columns to the end first
  for ( let row of all_rows ) {
    let cols = row.querySelectorAll(':scope > *');
    let id_cell = cols[ id_index ];
    let org_cell = cols[ org_header_index ];
    let unemployment_cell = cols[ unemployment_index ];
    let lang_cell = cols[ lang_header_index ];
    let created_cell = cols[ created_index ];

    created_cell.parentNode.insertBefore( lang_cell, created_cell.nextSibling );
    row.appendChild( id_cell );
    row.appendChild( unemployment_cell );
    row.appendChild( org_cell );

    // // Add new column for status data
    // let new_status_col = document.createElement('td');
    // new_status_col.className = 'bookmarklet_status_col';
    // let name_cell = cols[ name_header_index ];
    // name_cell.parentNode.insertBefore( new_status_col, name_cell.nextSibling );
  }

  // Now that the order of old columns is all set,
  // add new column with its own header 
  let new_years_header = document.createElement('th');
  new_years_header.className = 'bookmarklet_tax_year_col index-table__header';
  new_years_header.setAttribute( 'scope', 'col' );
  new_years_header.innerText = 'Tax years info';

  let header_row = all_rows[0];
  let cols = header_row.querySelectorAll(':scope > *');
  let name_header_cell = cols[ name_header_index ];
  name_header_cell.parentNode.insertBefore( new_years_header, name_header_cell.nextSibling );


  // Add new info cells
  for ( let row_data of new_info_data ) {
    let cols = row_data.row.querySelectorAll(':scope > *');

    // Add status, year, and assignee data
    let name_cell = cols[ name_header_index ];
    name_cell.parentNode.insertBefore( row_data.years, name_cell.nextSibling );
  }

  // for ( let row_i = 0; row_i < all_rows.length; row_i++; ) {
  //   let row = all_rows[ row_i ];
  //   let year_row = 

  //   // Add new tax years column
  //   let cols = row.querySelectorAll(':scope > *');
  //   let name_cell = cols[ name_header_index ];


  //   if ( all_rows.indexOf( row ) === 0 ) {
  //   } else {
  //     name_cell.parentNode.insertBefore( new_years_header, name_cell.nextSibling );
  //   }

  //   // // Add new column for status data
  //   // let new_status_col = document.createElement('td');
  //   // new_status_col.className = 'bookmarklet_status_col';
  //   // let name_cell = cols[ name_header_index ];
  //   // name_cell.parentNode.insertBefore( new_status_col, name_cell.nextSibling );
  // }

  var css = document.createElement('style');
  css.innerHTML = `
td.index-table__cell,
th.index-table__header,
.index-table__row-header {
padding: 0 0.5em;
}
.tax-return-list__assignment {
min-height: unset;
}
.bookmarklet_org_subtitle {
  font-weight: 400;
}
.tax-return-list__certification {
  margin-right: 0;
}
.bookmarklet .tooltip__body {
  display: none;
}
.bookmarklet .tooltip__body.visible {
  display: block;
  opacity: 1;
}
  `;
  document.getElementsByTagName('head')[0].appendChild(css);

};  // Ends squish()


try {
  squish();
} catch ( err ) {
  console.log( '"Squish" bookmarklet ran into an error.' );
  console.error( err );
}
