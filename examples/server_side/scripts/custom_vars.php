<?php

/*
 * DataTables example server-side processing script.
 *
 * Please note that this script is intentionally extremely simple to show how
 * server-side processing can be implemented, and probably shouldn't be used as
 * the basis for a large complex system. It is suitable for simple use cases as
 * for learning.
 *
 * See https://datatables.net/usage/server-side for full details on the server-
 * side processing requirements of DataTables.
 *
 * @license MIT - https://datatables.net/license_mit
 */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Easy set variables
 */

// DB table to use
$table = 'datatables_demo';

// Table's primary key
$primaryKey = 'id';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes
$columns = array(
	array('db' => 'first_name', 'dt' => 0),
	array('db' => 'last_name', 'dt' => 1),
	array('db' => 'position', 'dt' => 2),
	array('db' => 'office', 'dt' => 3),
	array(
		'db' => 'start_date',
		'dt' => 4,
		'formatter' => function ($d, $row) {
			return date('jS M y', strtotime($d));
		}
	),
	array(
		'db' => 'salary',
		'dt' => 5,
		'formatter' => function ($d, $row) {
			return '$' . number_format($d);
		}
	)
);

// SQL server connection information
$sql_details = array(
	'user' => '',
	'pass' => '',
	'db' => '',
	'host' => ''
	// ,'charset' => 'utf8' // Depending on your PHP and MySQL config, you may need this
);


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */

require('ssp.class.php');

echo json_encode(
	SSP::complex($_GET, $sql_details, $table, $primaryKey, $columns, [
		'condition' => 'office LIKE :office',
		'bindings' => [
			'office' => '%' . $_GET['officeFilter'] . '%'
		]
	])
);


