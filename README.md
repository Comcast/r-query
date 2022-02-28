# R-Query
R-Query is a library, and a CLI, which allows querying over one or more repositories' source code via SQL-like syntax name *RQL*. This can be integrated into a typescript project and/or run as a standalone command line tool.

## Query Structure
The following context free grammar summarizes the query syntax:
``` sql
Select
    <fieldName> [, <fieldName>]*
From
    (*|([<repoName>|<regularExpression>] [, (<repoName>|<regularExpression>)]*)
Where
    <whereCondition> [(and|or) <whereCondition>]*
```

The Where condition can be omitted. The From statement can be omitted when running the command-line version of R-Query though the behavior will change as outlined below.

## Fields
The following fields are selectable:

|FieldName|Description|DataType|
|---------|-----------|--------|
|RepoName|Name of the repo to which the file belongs.|string|
|FileName|Name of the file relative to the root of the repo.|string|
|FileContents|Full contents of the file.|string|
|FileImportStatements|Array of import-statement tuples.|file_import_statements|
|FileExportStatements|Array of export-statement tuples.|file_export_statements|
|FileNumLines|Number of lines in the file.|number|
|FileNumLinesSource|Number of lines excluding comments.|number|
|FileNumLinesComments|Number of lines which are comments.|number|
|FileNumLinesTodo|Number of lines with a TODO marker.|number|
|FileNameSplit|Array of strings, the filename is split by directory.|list (implicitly list of strings)|
|FileNameExtension|Extension of the file (".ts", ".cs", etc).|string|


The type definition for file_import_statements:
```json
[{
    "moduleName": "<original name of module>",
    "moduleAlias": "<name of module if it was aliased, otherwise original name of module>",
    "fromSource": "<name of the source the file came from>"
}]

The type definition for file_export_statements:

[{
    "name": "<export name>",
    "type": "<type declaration of item>"
}]
```

Fields and comparison operators are case insensitive and can have an optional underscore between words. Field names can be further aliased as follows: **Select fileName as 'file' From some-source**

**Note: there is no star selector "*" for the "Select" portion of the query, all required field names must be stated explicitly.

## Source Repositories
The "From" field accepts the following types of sources:
* **Star:** "*" select from all available repositories.
* **Name:** select from the repository with the given name.
* **Regular Expression:** select from all repositories which match the given regular expression.

A comma separated list can be used to include multiple repos and can mix and match names and regular expressions.

Regarding selectable repositories, the command line version of the tool behaves as follows:
* If a "From" statement is specified, the current working directory will be treated as the workspace and all 1st level child directories will be treated as the repositories.
* If a "From" statement is ommited entirely, the current working directory will be treated as the repository to which the query will be executed upon

## Conditional Statements
Queries can, and most often should, be refined by applying conditional statements in the where clause. A conditional statement can be summarized as: **<fieldName> <operator> <string|number|tuple>**

Different operators will be available depending upon the field type and the right hand comparison type will change accordingly. All operators are infix. The following types exist:

|Operator|Description|Field Type|Comparison Type|
|--------|-----------|----------|---------------|
|>|Greater than.|number|number|
|<|Less than.|number|number|
|>=|Greater than or equal to.|number|number|
|<=|Less than or equal to.|number|number|
|=|Equal to.|number | string|number | string|
|=any|Equal to anything in the provided list.|string|tuple<...string>|
|contains|Field contains something.|string | file_import_statement | file_export_statement|string | tuple<string (moduleName), string (fromSource)> | string|
|containsAll|Field contains all items in the list.|string|tuple<...string>|
|containsAny|Field contains any of the items in the list.|string|tuple<...string>|
|matches|Field matches regular expression.|string | file_import_statement | file_export_statement|regular_expression | tuple<regular_expression (moduleName), regularExpression (fromSource)> | regular_expression|
|matchesAll|Field matches all regular expressions.|string|tuple<...regular_expression>|
|matchesAny|Field matches any of regular expressions.|string|tuple<...regular_expression>|
|like|Field matches MSSQL "Like" comparison.|string|string|
|containsSomethingLike|Find a file where the contents have a string similar to the comparison provided.  This strips whitespaces, punctuation, and is case insensitive.|string|string|
|size=|Compare the size of an item to a numeric value.|list | file_import_statement | file_export_statement|number|
|size<|Size less than.|list | file_import_statement | file_export_statement|number|
|size>|Size greater than.|list | file_import_statement | file_export_statement|number|
|size<=|Size less than or equal to.|list | file_import_statement | file_export_statement|number|
|size>=|Size greater than or equal to.|list | file_import_statement | file_export_statement|number|

Strings are encased in single quotes and regular expressions are encased with "/", plus any additional flags on the right hand side (exactly the same as Javascript). Note that inclusion or exclusion of the "g" flag does not change the query execution. Tuples ordered lists which are used as parameters for the comparison operator. The context of each item in the tuple and its length depend upon the operator and field type. The tuple is enclosed with curly braces "{}" and each item is separated by a comma.

Multiple conditions can be joined using "and" or "or", and such conditions can be nested within each other. The following example showcases many of the comparisons listed in the table:

```sql
Select
    repoName,
    fileName
From
    /repo-.*/
Where
    fileName contains '.spec.ts'
    And
    (
        (
            fileContents matches /Injector/i
            Or
            fileImportStatements matches {/.*/, /@some-lib/}
        )
        Or
        fileImportStatements contains {'SpecialService', 'SpecialModule'}
    )
    Or
    fileNumLines >= 10000
```

Any condition can be negated by placing "!" directly in front of the operator (without any spaces).

Conditional statements are grouped into disjunctive normal form to replicate the behavior of Javascript. For example "one And two Or three" is evaluated as "(one And two) Or three". Parenthesis can be used to group conditions and subconditions. Conditions are evaluated in a short-circuit manner.

If an 'as' alias is used in the select statement, the where condition must refer to the variable's non-aliased name.